import { Track } from '../tracks/Track';
import { AudioEngine } from '../audio/AudioEngine';

/**
 * Mixer for managing tracks and routing
 */
export class Mixer {
  private tracks: Track[] = [];
  private audioEngine: AudioEngine;
  private analyserNodes: Map<string, AnalyserNode> = new Map();

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
  }

  /**
   * Add a track to the mixer
   */
  addTrack(track: Track): void {
    this.tracks.push(track);
    
    // Create analyser for VU meter
    const analyser = this.audioEngine.getContext().createAnalyser();
    analyser.fftSize = 2048;
    this.analyserNodes.set(track.getId(), analyser);
    
    // Connect track to analyser to master
    track.getOutput().connect(analyser);
    analyser.connect(this.audioEngine.getMasterBus());
  }

  /**
   * Remove a track from the mixer
   */
  removeTrack(trackId: string): void {
    const track = this.tracks.find(t => t.getId() === trackId);
    if (track) {
      // Disconnect
      track.getOutput().disconnect();
      
      const analyser = this.analyserNodes.get(trackId);
      if (analyser) {
        analyser.disconnect();
        this.analyserNodes.delete(trackId);
      }
      
      // Remove from list
      this.tracks = this.tracks.filter(t => t.getId() !== trackId);
      
      // Dispose track
      track.dispose();
    }
  }

  /**
   * Get all tracks
   */
  getTracks(): Track[] {
    return this.tracks;
  }

  /**
   * Get a track by ID
   */
  getTrack(trackId: string): Track | undefined {
    return this.tracks.find(t => t.getId() === trackId);
  }

  /**
   * Get track count
   */
  getTrackCount(): number {
    return this.tracks.length;
  }

  /**
   * Get track level (for VU meter)
   */
  getTrackLevel(trackId: string): number {
    const analyser = this.analyserNodes.get(trackId);
    if (!analyser) {
      return 0;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    const rms = Math.sqrt(sum / dataArray.length);
    return rms;
  }

  /**
   * Update solo states (mute all non-solo tracks when any track is soloed)
   */
  updateSoloStates(): void {
    const hasSolo = this.tracks.some(t => t.isSolo());
    
    this.tracks.forEach(track => {
      if (hasSolo && !track.isSolo()) {
        track.setMuted(true);
      } else if (hasSolo && track.isSolo()) {
        track.setMuted(false);
      }
    });
  }

  /**
   * Clear all tracks
   */
  clearTracks(): void {
    this.tracks.forEach(track => {
      this.removeTrack(track.getId());
    });
  }

  /**
   * Get master level
   */
  getMasterLevel(): number {
    const masterBus = this.audioEngine.getMasterBus();
    const analyser = this.audioEngine.getContext().createAnalyser();
    analyser.fftSize = 2048;
    
    // Temporarily connect for analysis
    masterBus.connect(analyser);
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    analyser.disconnect();
    
    const rms = Math.sqrt(sum / dataArray.length);
    return rms;
  }
}
