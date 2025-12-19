import { Track } from './Track';

/**
 * Audio track for playing audio files
 * Supports VST effects plugins
 */
export class AudioTrack extends Track {
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  constructor(audioContext: AudioContext, name: string = 'Audio Track') {
    super(audioContext, name);
  }

  getType(): string {
    return 'audio';
  }

  /**
   * Load audio buffer from URL
   */
  async loadAudio(url: string): Promise<void> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * Set audio buffer directly
   */
  setAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
  }

  /**
   * Get audio buffer
   */
  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  /**
   * Play the audio track
   */
  play(startTime: number = 0): void {
    if (!this.audioBuffer) {
      return;
    }

    this.stop();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode!);
    this.sourceNode.start(this.audioContext.currentTime, startTime);
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {
        // Already stopped
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  /**
   * Check if track is playing
   */
  isPlaying(): boolean {
    return this.sourceNode !== null;
  }

  override dispose(): void {
    this.stop();
    super.dispose();
  }
}
