/**
 * Transport state
 */
export type TransportState = 'stopped' | 'playing' | 'paused';

/**
 * Transport controls for playback
 */
export class Transport {
  private state: TransportState = 'stopped';
  private tempo: number = 120; // BPM
  private timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 };
  private playheadPosition: number = 0; // in beats
  private startTime: number = 0;
  private audioContext: AudioContext;
  private listeners: Map<string, Set<Function>> = new Map();
  private loopEnabled: boolean = false;
  private loopStart: number = 0;
  private loopEnd: number = 8; // 8 beats default

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Start playback
   */
  play(): void {
    if (this.state === 'playing') {
      return;
    }

    this.startTime = this.audioContext.currentTime - this.playheadPosition;
    this.state = 'playing';
    this.emit('stateChanged', this.state);
    this.emit('play');
    this.startPlaybackLoop();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.state = 'paused';
    this.emit('stateChanged', this.state);
    this.emit('pause');
  }

  /**
   * Stop playback and reset position
   */
  stop(): void {
    this.state = 'stopped';
    this.playheadPosition = 0;
    this.emit('stateChanged', this.state);
    this.emit('stop');
    this.emit('positionChanged', this.playheadPosition);
  }

  /**
   * Get current state
   */
  getState(): TransportState {
    return this.state;
  }

  /**
   * Set tempo in BPM
   */
  setTempo(bpm: number): void {
    this.tempo = Math.max(20, Math.min(300, bpm));
    this.emit('tempoChanged', this.tempo);
  }

  /**
   * Get tempo in BPM
   */
  getTempo(): number {
    return this.tempo;
  }

  /**
   * Set time signature
   */
  setTimeSignature(numerator: number, denominator: number): void {
    this.timeSignature = { numerator, denominator };
    this.emit('timeSignatureChanged', this.timeSignature);
  }

  /**
   * Get time signature
   */
  getTimeSignature(): { numerator: number; denominator: number } {
    return this.timeSignature;
  }

  /**
   * Get playhead position in beats
   */
  getPosition(): number {
    if (this.state === 'playing') {
      const elapsed = this.audioContext.currentTime - this.startTime;
      const beats = elapsed * (this.tempo / 60);
      
      if (this.loopEnabled && beats >= this.loopEnd) {
        const loopLength = this.loopEnd - this.loopStart;
        this.playheadPosition = this.loopStart + ((beats - this.loopStart) % loopLength);
        return this.playheadPosition;
      }
      
      this.playheadPosition = beats;
    }
    return this.playheadPosition;
  }

  /**
   * Set playhead position in beats
   */
  setPosition(beats: number): void {
    this.playheadPosition = Math.max(0, beats);
    if (this.state === 'playing') {
      this.startTime = this.audioContext.currentTime - this.playheadPosition;
    }
    this.emit('positionChanged', this.playheadPosition);
  }

  /**
   * Enable/disable loop
   */
  setLoopEnabled(enabled: boolean): void {
    this.loopEnabled = enabled;
    this.emit('loopChanged', { enabled, start: this.loopStart, end: this.loopEnd });
  }

  /**
   * Set loop points
   */
  setLoopPoints(start: number, end: number): void {
    this.loopStart = Math.max(0, start);
    this.loopEnd = Math.max(this.loopStart + 1, end);
    this.emit('loopChanged', { enabled: this.loopEnabled, start: this.loopStart, end: this.loopEnd });
  }

  /**
   * Convert beats to seconds
   */
  beatsToSeconds(beats: number): number {
    return beats * (60 / this.tempo);
  }

  /**
   * Convert seconds to beats
   */
  secondsToBeats(seconds: number): number {
    return seconds * (this.tempo / 60);
  }

  /**
   * Playback loop for updating position
   */
  private startPlaybackLoop(): void {
    const update = () => {
      if (this.state === 'playing') {
        this.emit('positionChanged', this.getPosition());
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}
