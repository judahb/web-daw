/**
 * Core audio engine for the web DAW
 * Manages the Web Audio API context and audio routing
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;

  constructor() {
    // Audio context created on user interaction
  }

  /**
   * Initialize the audio engine
   * Must be called after user interaction due to browser autoplay policies
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 48000
    });

    // Create master bus (stereo)
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.audioContext.destination);

    this.isInitialized = true;
  }

  /**
   * Get the audio context
   */
  getContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('Audio engine not initialized');
    }
    return this.audioContext;
  }

  /**
   * Get the master gain node (stereo master bus)
   */
  getMasterBus(): GainNode {
    if (!this.masterGain) {
      throw new Error('Audio engine not initialized');
    }
    return this.masterGain;
  }

  /**
   * Get current time from audio context
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Suspend audio context
   */
  async suspend(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'running') {
      await this.audioContext.suspend();
    }
  }

  /**
   * Resume audio context
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.isInitialized = false;
    }
  }
}
