# Web DAW - Cloud-Hosted Digital Audio Workstation

A professional-grade web-based Digital Audio Workstation (DAW) with VST plugin support, built on Web Audio API. Features audio and MIDI tracks, real-time mixing, sequencing, and remote plugin loading with browser caching.

## Features

### Core Audio Engine
- **Audio Tracks**: Support for audio file playback with VST effects
- **MIDI Tracks**: MIDI sequencing with VST instrument support
- **User-Selectable Track Count**: Add or remove tracks dynamically
- **Fixed Stereo Master Bus**: Professional stereo output routing
- **Low-Latency Processing**: Optimized for interactive audio performance

### Mixer & Transport
- **Per-Track Volume Control**: Independent volume control for each track
- **Per-Track Panning**: Stereo positioning (-1 to +1)
- **Mute & Solo**: Professional mixing workflow support
- **VU Meters**: Real-time audio level monitoring
- **Transport Controls**: Play, Pause, Stop with timeline
- **Tempo Control**: 20-300 BPM range
- **Time Signature**: Configurable time signatures

### Sequencer
- **MIDI Sequencing**: Piano roll-style MIDI editing
- **Audio Clips**: Timeline-based audio clip arrangement
- **Loop Support**: Configurable loop points
- **Multi-Track Recording**: Support for multiple simultaneous tracks

### Plugin System
- **VST Instrument Support**: Load virtual instruments for MIDI tracks
- **VST Effects Support**: Audio effects processing for audio tracks
- **Remote Plugin Loading**: Load plugins on-demand from remote server
- **Browser Caching**: Intelligent plugin caching for performance
- **Open-Source VST Support**: Compatible with open-source VST plugins
- **AudioGridder Client**: Integration with AudioGridder for remote VST processing

### Backend Architecture
- **Decoupled Design**: Clean separation between audio engine and UI
- **Web Audio API**: Native browser audio processing
- **AudioWorklet Ready**: Prepared for low-latency audio processing nodes
- **WebSocket Support**: Real-time communication for AudioGridder

## Installation

```bash
# Clone the repository
git clone https://github.com/judahb/web-daw.git
cd web-daw

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Usage

### Basic Usage

```typescript
import { DAW } from './DAW';

// Create DAW instance
const daw = new DAW({
  pluginServerUrl: '/api/plugins',
  audioGridderConfig: {
    serverUrl: 'localhost',
    port: 8080
  }
});

// Initialize (requires user interaction)
await daw.initialize();

// Create tracks
const audioTrack = daw.createAudioTrack('Guitar');
const midiTrack = daw.createMidiTrack('Synth');

// Load audio
await audioTrack.loadAudio('/path/to/audio.wav');

// Add MIDI notes
midiTrack.addNote({
  note: 60, // Middle C
  velocity: 100,
  startTime: 0,
  duration: 1.0
});

// Control transport
daw.play();
daw.pause();
daw.stop();

// Set tempo
daw.getTransport().setTempo(120);
```

### Working with Plugins

```typescript
// Get available plugins
const plugins = await daw.getAvailablePlugins();

// Load a plugin
const pluginMetadata = {
  id: 'simple-synth',
  name: 'Simple Synth',
  type: 'instrument',
  url: 'example-synth.js',
  version: '1.0.0',
  manufacturer: 'Web DAW'
};

const plugin = await daw.loadPlugin(pluginMetadata);

// Assign plugin to MIDI track
midiTrack.setInstrument(plugin);

// Add effect to audio track
audioTrack.addPlugin(plugin);
```

### Using AudioGridder

```typescript
// AudioGridder is configured during DAW initialization
const daw = new DAW({
  audioGridderConfig: {
    serverUrl: 'your-audiogridder-server.com',
    port: 8080
  }
});

await daw.initialize();

// Get AudioGridder client
const audioGridder = daw.getAudioGridder();

if (audioGridder && audioGridder.isConnected()) {
  // Get available plugins from AudioGridder
  const plugins = await audioGridder.getAvailablePlugins();
  
  // Load a plugin
  const instanceId = await audioGridder.loadPlugin('plugin-id');
  
  // Process audio
  const processedAudio = await audioGridder.processAudio(instanceId, audioData);
}
```

### Mixer Control

```typescript
const mixer = daw.getMixer();

// Get all tracks
const tracks = mixer.getTracks();

// Control individual track
const track = tracks[0];
track.setVolume(0.8);
track.setPan(-0.5); // Pan left
track.setMuted(false);
track.setSolo(false);

// Get track level for VU meter
const level = mixer.getTrackLevel(track.getId());

// Set master volume
daw.setMasterVolume(0.8);
```

### Sequencer

```typescript
const sequencer = daw.getSequencer();

// Add a clip
sequencer.addClip({
  id: 'clip-1',
  trackId: audioTrack.getId(),
  startBeat: 0,
  lengthBeats: 8,
  offset: 0
});

// Get clips for a track
const clips = sequencer.getClipsForTrack(audioTrack.getId());
```

## Architecture

### Project Structure

```
web-daw/
├── src/
│   ├── audio/           # Audio engine core
│   │   └── AudioEngine.ts
│   ├── tracks/          # Track implementations
│   │   ├── Track.ts
│   │   ├── AudioTrack.ts
│   │   └── MidiTrack.ts
│   ├── plugins/         # Plugin system
│   │   ├── PluginLoader.ts
│   │   └── AudioGridderClient.ts
│   ├── transport/       # Transport controls
│   │   └── Transport.ts
│   ├── sequencer/       # Sequencer
│   │   └── Sequencer.ts
│   ├── mixer/           # Mixer
│   │   └── Mixer.ts
│   ├── ui/              # User interface
│   │   ├── UI.ts
│   │   └── styles.css
│   ├── DAW.ts           # Main DAW class
│   └── main.ts          # Entry point
├── public/
│   └── plugins/         # Plugin files
│       ├── example-synth.js
│       ├── example-reverb.js
│       └── list.json
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Component Responsibilities

- **AudioEngine**: Manages Web Audio API context and master bus
- **Track**: Base class for all track types with volume, pan, mute, solo
- **AudioTrack**: Handles audio file playback and effects
- **MidiTrack**: Manages MIDI notes and instruments
- **Transport**: Controls playback, tempo, time signature, and position
- **Sequencer**: Manages clips and scheduling
- **Mixer**: Routes tracks to master bus and provides level metering
- **PluginLoader**: Loads and caches plugins from remote server
- **AudioGridderClient**: Communicates with AudioGridder server
- **UI**: Provides user interface for all DAW functions

## Creating Custom Plugins

### Instrument Plugin

```javascript
function createPlugin(audioContext, metadata) {
  class MyInstrument {
    constructor(audioContext) {
      this.audioContext = audioContext;
      this.outputNode = audioContext.createGain();
    }

    connect(destination) {
      this.outputNode.connect(destination);
    }

    disconnect() {
      this.outputNode.disconnect();
    }

    triggerAttackRelease(frequency, duration, time, velocity) {
      // Implement note triggering
    }

    noteOn(note, velocity) {
      // MIDI note on
    }

    noteOff(note) {
      // MIDI note off
    }
  }

  return new MyInstrument(audioContext);
}
```

### Effect Plugin

```javascript
function createPlugin(audioContext, metadata) {
  class MyEffect {
    constructor(audioContext) {
      this.audioContext = audioContext;
      this.inputNode = audioContext.createGain();
      this.outputNode = audioContext.createGain();
      
      // Setup audio processing nodes
      this.inputNode.connect(this.outputNode);
    }

    connect(destination) {
      this.outputNode.connect(destination);
    }

    disconnect() {
      this.outputNode.disconnect();
    }

    setParameter(name, value) {
      // Implement parameter control
    }
  }

  return new MyEffect(audioContext);
}
```

## Plugin Server Setup

Create a simple plugin server to serve plugins:

```javascript
// server.js
import express from 'express';
import path from 'path';

const app = express();

// Serve plugin list
app.get('/api/plugins/list', (req, res) => {
  res.json([
    {
      id: 'my-plugin',
      name: 'My Plugin',
      type: 'instrument',
      url: 'my-plugin.js',
      version: '1.0.0',
      manufacturer: 'My Company'
    }
  ]);
});

// Serve plugin files
app.get('/api/plugins/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, 'plugins', req.params.filename));
});

app.listen(3001, () => {
  console.log('Plugin server running on port 3001');
});
```

## AudioGridder Setup

1. Install AudioGridder server on a computer with your VST plugins
2. Configure the server to accept connections
3. Update the DAW configuration with the server URL and port
4. Connect and use remote VST processing

## Browser Compatibility

- Chrome/Edge 89+
- Firefox 88+
- Safari 14.1+

Requires support for:
- Web Audio API
- AudioWorklet
- WebSocket (for AudioGridder)
- ES2020

## Performance Considerations

- **Latency**: Set audio context latency hint to 'interactive' for low latency
- **Buffer Size**: Adjustable via audio context configuration
- **Plugin Loading**: Plugins are cached after first load
- **CPU Usage**: Monitor track count and plugin usage
- **Memory**: Dispose of unused tracks and plugins

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Roadmap

- [ ] MIDI file import/export
- [ ] Audio recording
- [ ] More built-in effects and instruments
- [ ] Plugin preset management
- [ ] Project save/load
- [ ] Collaboration features
- [ ] Mobile support
- [ ] WebRTC audio streaming
- [ ] Advanced automation
- [ ] VST3 support

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Credits

Built with:
- Web Audio API
- TypeScript
- Vite
- Tone.js (for MIDI timing utilities)

Inspired by professional DAWs like Ableton Live, FL Studio, and Reaper.