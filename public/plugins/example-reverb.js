/**
 * Example VST Effect Plugin - Simple Reverb
 * This is an open-source example plugin
 */
function createPlugin(audioContext, metadata) {
  class SimpleReverb {
    constructor(audioContext) {
      this.audioContext = audioContext;
      this.inputNode = audioContext.createGain();
      this.outputNode = audioContext.createGain();
      this.convolver = audioContext.createConvolver();
      this.dryGain = audioContext.createGain();
      this.wetGain = audioContext.createGain();
      
      // Default mix
      this.dryGain.gain.value = 0.7;
      this.wetGain.gain.value = 0.3;
      
      // Create impulse response
      this.createImpulseResponse();
      
      // Setup routing
      this.inputNode.connect(this.dryGain);
      this.inputNode.connect(this.convolver);
      this.convolver.connect(this.wetGain);
      
      this.dryGain.connect(this.outputNode);
      this.wetGain.connect(this.outputNode);
    }

    createImpulseResponse() {
      const sampleRate = this.audioContext.sampleRate;
      const length = sampleRate * 2; // 2 seconds
      const impulse = this.audioContext.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
      }
      
      this.convolver.buffer = impulse;
    }

    connect(destination) {
      this.outputNode.connect(destination);
    }

    disconnect() {
      this.outputNode.disconnect();
    }

    setMix(mix) {
      // mix: 0 (dry) to 1 (wet)
      this.dryGain.gain.value = 1 - mix;
      this.wetGain.gain.value = mix;
    }

    process(inputBuffer) {
      // For offline processing if needed
      return inputBuffer;
    }
  }

  return new SimpleReverb(audioContext);
}

// Export for plugin loader
if (typeof module !== 'undefined' && module.exports) {
  module.exports = createPlugin;
}
