/**
 * Example VST Instrument Plugin - Simple Synthesizer
 * This is an open-source example plugin
 */
function createPlugin(audioContext, metadata) {
  class SimpleSynth {
    constructor(audioContext) {
      this.audioContext = audioContext;
      this.outputNode = audioContext.createGain();
      this.outputNode.gain.value = 0.3;
      this.activeOscillators = new Map();
    }

    connect(destination) {
      this.outputNode.connect(destination);
    }

    disconnect() {
      this.outputNode.disconnect();
    }

    triggerAttackRelease(frequency, duration, time = this.audioContext.currentTime, velocity = 1) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Simple ADSR envelope
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      
      // Attack
      gainNode.gain.setValueAtTime(0, time);
      gainNode.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.01);
      
      // Decay/Sustain
      gainNode.gain.linearRampToValueAtTime(velocity * 0.5, time + 0.1);
      
      // Release
      gainNode.gain.linearRampToValueAtTime(0, time + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.outputNode);
      
      oscillator.start(time);
      oscillator.stop(time + duration);
      
      const noteId = `${frequency}-${time}`;
      this.activeOscillators.set(noteId, { oscillator, gainNode });
      
      setTimeout(() => {
        this.activeOscillators.delete(noteId);
      }, (duration + 0.1) * 1000);
    }

    noteOn(note, velocity) {
      const frequency = 440 * Math.pow(2, (note - 69) / 12);
      this.triggerAttackRelease(frequency, 1.0, this.audioContext.currentTime, velocity / 127);
    }

    noteOff(note) {
      // Note off would be handled here for sustained notes
    }
  }

  return new SimpleSynth(audioContext);
}

// Export for plugin loader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = createPlugin;
}
