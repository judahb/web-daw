/**
 * Base class for all track types
 */
export abstract class Track {
  protected id: string;
  protected name: string;
  protected volume: number = 0.8;
  protected pan: number = 0; // -1 (left) to 1 (right)
  protected muted: boolean = false;
  protected solo: boolean = false;
  protected gainNode: GainNode | null = null;
  protected pannerNode: StereoPannerNode | null = null;
  protected audioContext: AudioContext;
  protected plugins: any[] = [];

  constructor(audioContext: AudioContext, name: string) {
    this.id = this.generateId();
    this.name = name;
    this.audioContext = audioContext;
    this.initialize();
  }

  private generateId(): string {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected initialize(): void {
    // Create gain node for volume control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.volume;

    // Create stereo panner for pan control
    this.pannerNode = this.audioContext.createStereoPanner();
    this.pannerNode.pan.value = this.pan;

    // Connect gain to panner
    this.gainNode.connect(this.pannerNode);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  getVolume(): number {
    return this.volume;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.volume;
    }
  }

  getPan(): number {
    return this.pan;
  }

  setPan(pan: number): void {
    this.pan = Math.max(-1, Math.min(1, pan));
    if (this.pannerNode) {
      this.pannerNode.pan.value = this.pan;
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.gainNode) {
      this.gainNode.gain.value = muted ? 0 : this.volume;
    }
  }

  isSolo(): boolean {
    return this.solo;
  }

  setSolo(solo: boolean): void {
    this.solo = solo;
  }

  getOutput(): AudioNode {
    return this.pannerNode || this.gainNode!;
  }

  addPlugin(plugin: any): void {
    this.plugins.push(plugin);
  }

  removePlugin(plugin: any): void {
    const index = this.plugins.indexOf(plugin);
    if (index > -1) {
      this.plugins.splice(index, 1);
    }
  }

  getPlugins(): any[] {
    return this.plugins;
  }

  abstract getType(): string;

  dispose(): void {
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.pannerNode) {
      this.pannerNode.disconnect();
    }
    this.plugins = [];
  }
}
