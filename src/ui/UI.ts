import { DAW } from '../DAW';
import { Track } from '../tracks/Track';

/**
 * UI Manager for the DAW
 */
export class UI {
  private daw: DAW;
  private container: HTMLElement;

  constructor(daw: DAW, containerId: string) {
    this.daw = daw;
    const element = document.getElementById(containerId);
    if (!element) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    this.container = element;
    this.render();
    this.setupEventListeners();
  }

  /**
   * Render the UI
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="daw-container">
        <header class="daw-header">
          <h1>Web DAW</h1>
          <div class="transport-controls">
            <button id="play-btn" class="btn">▶️ Play</button>
            <button id="pause-btn" class="btn">⏸️ Pause</button>
            <button id="stop-btn" class="btn">⏹️ Stop</button>
            <span class="position" id="position">0.00</span>
            <div class="tempo-control">
              <label>BPM: </label>
              <input type="number" id="tempo-input" value="120" min="20" max="300" />
            </div>
          </div>
        </header>

        <div class="daw-content">
          <aside class="sidebar">
            <h3>Tracks</h3>
            <button id="add-audio-track" class="btn btn-primary">+ Audio Track</button>
            <button id="add-midi-track" class="btn btn-primary">+ MIDI Track</button>
            <div id="plugin-list" class="plugin-list">
              <h4>Plugins</h4>
              <div id="plugins"></div>
            </div>
          </aside>

          <main class="main-content">
            <div class="mixer" id="mixer">
              <h3>Mixer</h3>
              <div class="tracks-container" id="tracks-container"></div>
              <div class="master-channel">
                <h4>Master</h4>
                <input type="range" id="master-volume" min="0" max="100" value="80" orient="vertical" />
                <div class="meter" id="master-meter"></div>
              </div>
            </div>

            <div class="sequencer" id="sequencer">
              <h3>Sequencer</h3>
              <div class="timeline" id="timeline"></div>
            </div>
          </main>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Transport controls
    document.getElementById('play-btn')?.addEventListener('click', () => {
      this.daw.play();
    });

    document.getElementById('pause-btn')?.addEventListener('click', () => {
      this.daw.pause();
    });

    document.getElementById('stop-btn')?.addEventListener('click', () => {
      this.daw.stop();
    });

    document.getElementById('tempo-input')?.addEventListener('change', (e) => {
      const tempo = parseInt((e.target as HTMLInputElement).value);
      this.daw.getTransport().setTempo(tempo);
    });

    // Track controls
    document.getElementById('add-audio-track')?.addEventListener('click', () => {
      this.addAudioTrack();
    });

    document.getElementById('add-midi-track')?.addEventListener('click', () => {
      this.addMidiTrack();
    });

    // Master volume
    document.getElementById('master-volume')?.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value) / 100;
      this.daw.setMasterVolume(volume);
    });

    // Position update
    this.daw.getTransport().on('positionChanged', (position: number) => {
      const positionEl = document.getElementById('position');
      if (positionEl) {
        positionEl.textContent = position.toFixed(2);
      }
    });

    // Load available plugins
    this.loadPlugins();
  }

  /**
   * Add audio track
   */
  private addAudioTrack(): void {
    const trackCount = this.daw.getTracks().length;
    const track = this.daw.createAudioTrack(`Audio ${trackCount + 1}`);
    this.renderTrack(track);
  }

  /**
   * Add MIDI track
   */
  private addMidiTrack(): void {
    const trackCount = this.daw.getTracks().length;
    const track = this.daw.createMidiTrack(`MIDI ${trackCount + 1}`);
    this.renderTrack(track);
  }

  /**
   * Render a track in the mixer
   */
  private renderTrack(track: Track): void {
    const container = document.getElementById('tracks-container');
    if (!container) return;

    const trackEl = document.createElement('div');
    trackEl.className = 'track-channel';
    trackEl.id = `track-${track.getId()}`;
    trackEl.innerHTML = `
      <h4>${track.getName()}</h4>
      <div class="track-type">${track.getType().toUpperCase()}</div>
      <div class="track-controls">
        <label>Volume</label>
        <input type="range" class="volume-slider" min="0" max="100" value="80" orient="vertical" />
        <label>Pan</label>
        <input type="range" class="pan-slider" min="-100" max="100" value="0" />
        <button class="mute-btn">M</button>
        <button class="solo-btn">S</button>
        <button class="remove-btn">✕</button>
      </div>
      <div class="meter"></div>
    `;

    // Add event listeners
    const volumeSlider = trackEl.querySelector('.volume-slider') as HTMLInputElement;
    volumeSlider.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value) / 100;
      track.setVolume(volume);
    });

    const panSlider = trackEl.querySelector('.pan-slider') as HTMLInputElement;
    panSlider.addEventListener('input', (e) => {
      const pan = parseInt((e.target as HTMLInputElement).value) / 100;
      track.setPan(pan);
    });

    const muteBtn = trackEl.querySelector('.mute-btn') as HTMLButtonElement;
    muteBtn.addEventListener('click', () => {
      track.setMuted(!track.isMuted());
      muteBtn.classList.toggle('active');
    });

    const soloBtn = trackEl.querySelector('.solo-btn') as HTMLButtonElement;
    soloBtn.addEventListener('click', () => {
      track.setSolo(!track.isSolo());
      soloBtn.classList.toggle('active');
      this.daw.getMixer().updateSoloStates();
    });

    const removeBtn = trackEl.querySelector('.remove-btn') as HTMLButtonElement;
    removeBtn.addEventListener('click', () => {
      this.daw.removeTrack(track.getId());
      trackEl.remove();
    });

    container.appendChild(trackEl);
  }

  /**
   * Load available plugins
   */
  private async loadPlugins(): Promise<void> {
    try {
      const plugins = await this.daw.getAvailablePlugins();
      const pluginsContainer = document.getElementById('plugins');
      if (!pluginsContainer) return;

      plugins.forEach(plugin => {
        const pluginEl = document.createElement('div');
        pluginEl.className = 'plugin-item';
        pluginEl.innerHTML = `
          <span>${plugin.name}</span>
          <span class="plugin-type">${plugin.type}</span>
        `;
        pluginsContainer.appendChild(pluginEl);
      });
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  }

  /**
   * Update VU meters
   */
  startMeterUpdates(): void {
    const updateMeters = () => {
      const tracks = this.daw.getTracks();
      tracks.forEach(track => {
        const level = this.daw.getMixer().getTrackLevel(track.getId());
        const meterEl = document.querySelector(`#track-${track.getId()} .meter`) as HTMLElement;
        if (meterEl) {
          const height = Math.min(100, level * 100);
          meterEl.style.height = `${height}%`;
        }
      });

      requestAnimationFrame(updateMeters);
    };
    updateMeters();
  }
}
