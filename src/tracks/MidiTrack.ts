import { Track } from './Track';

/**
 * MIDI note structure
 */
export interface MidiNote {
  note: number;
  velocity: number;
  startTime: number;
  duration: number;
}

/**
 * MIDI track for sequencing notes
 * Supports VST instrument plugins
 */
export class MidiTrack extends Track {
  private notes: MidiNote[] = [];
  private instrument: any = null; // VST instrument will be loaded here

  constructor(audioContext: AudioContext, name: string = 'MIDI Track') {
    super(audioContext, name);
  }

  getType(): string {
    return 'midi';
  }

  /**
   * Add a MIDI note
   */
  addNote(note: MidiNote): void {
    this.notes.push(note);
    this.sortNotes();
  }

  /**
   * Remove a MIDI note
   */
  removeNote(note: MidiNote): void {
    const index = this.notes.indexOf(note);
    if (index > -1) {
      this.notes.splice(index, 1);
    }
  }

  /**
   * Get all notes
   */
  getNotes(): MidiNote[] {
    return this.notes;
  }

  /**
   * Clear all notes
   */
  clearNotes(): void {
    this.notes = [];
  }

  /**
   * Sort notes by start time
   */
  private sortNotes(): void {
    this.notes.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Set the instrument (VST)
   */
  setInstrument(instrument: any): void {
    this.instrument = instrument;
    if (instrument && instrument.connect) {
      instrument.connect(this.gainNode);
    }
  }

  /**
   * Get the instrument
   */
  getInstrument(): any {
    return this.instrument;
  }

  /**
   * Trigger a note
   */
  playNote(note: number, velocity: number, duration: number): void {
    if (!this.instrument) {
      // Fallback to simple oscillator if no instrument loaded
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.frequency.value = this.midiToFrequency(note);
      gainNode.gain.value = velocity / 127;
      
      oscillator.connect(gainNode);
      gainNode.connect(this.gainNode!);
      
      const now = this.audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + duration);
    } else if (this.instrument.triggerAttackRelease) {
      // Tone.js style instrument
      const frequency = this.midiToFrequency(note);
      this.instrument.triggerAttackRelease(frequency, duration, undefined, velocity / 127);
    }
  }

  /**
   * Convert MIDI note number to frequency
   */
  private midiToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Schedule all notes for playback
   * NOTE: Uses setTimeout for simplicity. In production, use Web Audio API
   * scheduling with audioContext.currentTime for sample-accurate timing.
   */
  scheduleNotes(startTime: number): void {
    this.notes.forEach(note => {
      const scheduleTime = startTime + note.startTime;
      // TODO: Use Web Audio API scheduling for better timing precision
      setTimeout(() => {
        this.playNote(note.note, note.velocity, note.duration);
      }, (scheduleTime - this.audioContext.currentTime) * 1000);
    });
  }

  override dispose(): void {
    if (this.instrument && this.instrument.disconnect) {
      this.instrument.disconnect();
    }
    this.clearNotes();
    super.dispose();
  }
}
