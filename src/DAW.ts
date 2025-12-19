import { AudioEngine } from './audio/AudioEngine';
import { AudioTrack } from './tracks/AudioTrack';
import { MidiTrack } from './tracks/MidiTrack';
import { Track } from './tracks/Track';
import { Transport } from './transport/Transport';
import { Sequencer } from './sequencer/Sequencer';
import { Mixer } from './mixer/Mixer';
import { PluginLoader, PluginMetadata } from './plugins/PluginLoader';
import { AudioGridderClient, AudioGridderConfig } from './plugins/AudioGridderClient';

/**
 * Configuration for the DAW
 */
export interface DAWConfig {
  pluginServerUrl?: string;
  audioGridderConfig?: AudioGridderConfig;
}

/**
 * Main DAW class
 * Coordinates all components of the Digital Audio Workstation
 */
export class DAW {
  private audioEngine: AudioEngine;
  private transport!: Transport;
  private sequencer!: Sequencer;
  private mixer!: Mixer;
  private pluginLoader!: PluginLoader;
  private audioGridder: AudioGridderClient | null = null;
  private initialized: boolean = false;
  private config: DAWConfig;

  constructor(config: DAWConfig = {}) {
    this.audioEngine = new AudioEngine();
    this.config = config;
  }

  /**
   * Initialize the DAW
   * Must be called after user interaction
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.audioEngine.initialize();
    
    // Now we can initialize components that need the audio context
    this.transport = new Transport(this.audioEngine.getContext());
    this.sequencer = new Sequencer(this.transport);
    this.mixer = new Mixer(this.audioEngine);
    this.pluginLoader = new PluginLoader(
      this.audioEngine.getContext(),
      this.config.pluginServerUrl
    );

    // Initialize AudioGridder if config provided
    if (this.config.audioGridderConfig) {
      this.audioGridder = new AudioGridderClient(
        this.audioEngine.getContext(),
        this.config.audioGridderConfig
      );
      try {
        await this.audioGridder.connect();
        console.log('AudioGridder connected');
      } catch (error) {
        console.warn('Failed to connect to AudioGridder:', error);
      }
    }

    this.initialized = true;
  }

  /**
   * Create an audio track
   */
  createAudioTrack(name?: string): AudioTrack {
    const track = new AudioTrack(this.audioEngine.getContext(), name);
    this.mixer.addTrack(track);
    this.sequencer.addTrack(track);
    return track;
  }

  /**
   * Create a MIDI track
   */
  createMidiTrack(name?: string): MidiTrack {
    const track = new MidiTrack(this.audioEngine.getContext(), name);
    this.mixer.addTrack(track);
    this.sequencer.addTrack(track);
    return track;
  }

  /**
   * Remove a track
   */
  removeTrack(trackId: string): void {
    this.mixer.removeTrack(trackId);
    this.sequencer.removeTrack(trackId);
  }

  /**
   * Get all tracks
   */
  getTracks(): Track[] {
    return this.mixer.getTracks();
  }

  /**
   * Get transport
   */
  getTransport(): Transport {
    return this.transport;
  }

  /**
   * Get sequencer
   */
  getSequencer(): Sequencer {
    return this.sequencer;
  }

  /**
   * Get mixer
   */
  getMixer(): Mixer {
    return this.mixer;
  }

  /**
   * Get plugin loader
   */
  getPluginLoader(): PluginLoader {
    return this.pluginLoader;
  }

  /**
   * Get AudioGridder client
   */
  getAudioGridder(): AudioGridderClient | null {
    return this.audioGridder;
  }

  /**
   * Load a plugin
   */
  async loadPlugin(metadata: PluginMetadata): Promise<any> {
    return await this.pluginLoader.loadPlugin(metadata);
  }

  /**
   * Get available plugins
   */
  async getAvailablePlugins(): Promise<PluginMetadata[]> {
    return await this.pluginLoader.getAvailablePlugins();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.audioEngine.setMasterVolume(volume);
  }

  /**
   * Play
   */
  play(): void {
    this.transport.play();
  }

  /**
   * Pause
   */
  pause(): void {
    this.transport.pause();
  }

  /**
   * Stop
   */
  stop(): void {
    this.transport.stop();
  }

  /**
   * Dispose of the DAW and cleanup resources
   */
  async dispose(): Promise<void> {
    this.stop();
    this.mixer.clearTracks();
    this.sequencer.clearClips();
    
    if (this.audioGridder) {
      this.audioGridder.disconnect();
    }
    
    await this.audioEngine.dispose();
    this.initialized = false;
  }
}
