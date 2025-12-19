import { DAW } from './DAW';
import { UI } from './ui/UI';
import './ui/styles.css';

/**
 * Initialize the DAW application
 */
async function initializeApp() {
  // Create DAW instance
  const daw = new DAW({
    pluginServerUrl: '/api/plugins',
    audioGridderConfig: {
      serverUrl: 'localhost',
      port: 8080
    }
  });

  // Wait for user interaction before initializing audio
  const initButton = document.getElementById('init-app');
  if (initButton) {
    initButton.addEventListener('click', async () => {
      try {
        await daw.initialize();
        console.log('DAW initialized');
        
        // Hide init button and show DAW UI
        initButton.style.display = 'none';
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.style.display = 'block';
        }

        // Create UI
        const ui = new UI(daw, 'app');
        ui.startMeterUpdates();

        // Add some demo tracks
        daw.createAudioTrack('Audio 1');
        daw.createMidiTrack('MIDI 1');

        // Make DAW available globally for debugging
        (window as any).daw = daw;
        (window as any).ui = ui;
        
        console.log('Web DAW ready!');
      } catch (error) {
        console.error('Failed to initialize DAW:', error);
        alert('Failed to initialize DAW. Please check console for details.');
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
