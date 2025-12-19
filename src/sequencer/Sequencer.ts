import { Track } from '../tracks/Track';
import { MidiTrack } from '../tracks/MidiTrack';
import { AudioTrack } from '../tracks/AudioTrack';
import { Transport } from '../transport/Transport';

/**
 * Clip for sequencing
 */
export interface Clip {
  id: string;
  trackId: string;
  startBeat: number;
  lengthBeats: number;
  offset: number;
}

/**
 * Sequencer manages clips and playback scheduling
 */
export class Sequencer {
  private clips: Clip[] = [];
  private tracks: Map<string, Track> = new Map();
  private transport: Transport;
  private scheduledEvents: Map<string, any> = new Map();

  constructor(transport: Transport) {
    this.transport = transport;
    this.setupTransportListeners();
  }

  /**
   * Add a track to the sequencer
   */
  addTrack(track: Track): void {
    this.tracks.set(track.getId(), track);
  }

  /**
   * Remove a track from the sequencer
   */
  removeTrack(trackId: string): void {
    this.tracks.delete(trackId);
    // Remove all clips for this track
    this.clips = this.clips.filter(clip => clip.trackId !== trackId);
  }

  /**
   * Add a clip
   */
  addClip(clip: Clip): void {
    this.clips.push(clip);
    this.sortClips();
  }

  /**
   * Remove a clip
   */
  removeClip(clipId: string): void {
    this.clips = this.clips.filter(clip => clip.id !== clipId);
  }

  /**
   * Get all clips
   */
  getClips(): Clip[] {
    return this.clips;
  }

  /**
   * Get clips for a specific track
   */
  getClipsForTrack(trackId: string): Clip[] {
    return this.clips.filter(clip => clip.trackId === trackId);
  }

  /**
   * Sort clips by start time
   */
  private sortClips(): void {
    this.clips.sort((a, b) => a.startBeat - b.startBeat);
  }

  /**
   * Setup transport listeners
   */
  private setupTransportListeners(): void {
    this.transport.on('play', () => {
      this.schedulePlayback();
    });

    this.transport.on('stop', () => {
      this.stopPlayback();
    });

    this.transport.on('pause', () => {
      this.stopPlayback();
    });
  }

  /**
   * Schedule playback of all clips
   */
  private schedulePlayback(): void {
    const currentBeat = this.transport.getPosition();
    
    this.clips.forEach(clip => {
      if (clip.startBeat >= currentBeat) {
        this.scheduleClip(clip);
      }
    });
  }

  /**
   * Schedule a single clip
   */
  private scheduleClip(clip: Clip): void {
    const track = this.tracks.get(clip.trackId);
    if (!track) {
      return;
    }

    const startTime = this.transport.beatsToSeconds(clip.startBeat);
    const duration = this.transport.beatsToSeconds(clip.lengthBeats);

    if (track instanceof MidiTrack) {
      // Schedule MIDI notes
      const notes = track.getNotes();
      notes.forEach(note => {
        if (note.startTime >= clip.offset && note.startTime < clip.offset + duration) {
          const scheduleTime = startTime + note.startTime - clip.offset;
          setTimeout(() => {
            track.playNote(note.note, note.velocity, note.duration);
          }, scheduleTime * 1000);
        }
      });
    } else if (track instanceof AudioTrack) {
      // Schedule audio playback
      setTimeout(() => {
        track.play(clip.offset);
      }, startTime * 1000);
    }

    this.scheduledEvents.set(clip.id, { track, startTime });
  }

  /**
   * Stop playback
   */
  private stopPlayback(): void {
    this.scheduledEvents.clear();
    
    this.tracks.forEach(track => {
      if (track instanceof AudioTrack) {
        track.stop();
      }
    });
  }

  /**
   * Clear all clips
   */
  clearClips(): void {
    this.clips = [];
  }
}
