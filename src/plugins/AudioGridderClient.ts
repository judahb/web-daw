/**
 * AudioGridder client integration
 * Allows connection to AudioGridder server for remote VST processing
 */
export interface AudioGridderConfig {
  serverUrl: string;
  port: number;
}

/**
 * AudioGridder client for remote VST processing
 */
export class AudioGridderClient {
  private config: AudioGridderConfig;
  private connected: boolean = false;
  private websocket: WebSocket | null = null;

  constructor(_audioContext: AudioContext, config: AudioGridderConfig) {
    this.config = config;
  }

  /**
   * Connect to AudioGridder server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.config.serverUrl}:${this.config.port}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('Connected to AudioGridder server');
        this.connected = true;
        resolve();
      };

      this.websocket.onerror = (error) => {
        console.error('AudioGridder connection error:', error);
        this.connected = false;
        reject(error);
      };

      this.websocket.onclose = () => {
        console.log('AudioGridder connection closed');
        this.connected = false;
      };
    });
  }

  /**
   * Disconnect from AudioGridder server
   */
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get available plugins from AudioGridder server
   */
  async getAvailablePlugins(): Promise<any[]> {
    if (!this.connected) {
      throw new Error('Not connected to AudioGridder server');
    }

    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const message = JSON.stringify({
        type: 'list_plugins'
      });

      this.websocket.send(message);

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.type === 'plugin_list') {
          this.websocket?.removeEventListener('message', handler);
          resolve(response.plugins);
        }
      };

      this.websocket.addEventListener('message', handler);

      setTimeout(() => {
        this.websocket?.removeEventListener('message', handler);
        reject(new Error('Timeout waiting for plugin list'));
      }, 5000);
    });
  }

  /**
   * Load a plugin on the AudioGridder server
   */
  async loadPlugin(pluginId: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to AudioGridder server');
    }

    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const message = JSON.stringify({
        type: 'load_plugin',
        pluginId
      });

      this.websocket.send(message);

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.type === 'plugin_loaded' && response.pluginId === pluginId) {
          this.websocket?.removeEventListener('message', handler);
          resolve(response.instanceId);
        } else if (response.type === 'error') {
          this.websocket?.removeEventListener('message', handler);
          reject(new Error(response.message));
        }
      };

      this.websocket.addEventListener('message', handler);

      setTimeout(() => {
        this.websocket?.removeEventListener('message', handler);
        reject(new Error('Timeout loading plugin'));
      }, 10000);
    });
  }

  /**
   * Process audio through AudioGridder
   */
  async processAudio(instanceId: string, audioData: Float32Array): Promise<Float32Array> {
    if (!this.connected) {
      throw new Error('Not connected to AudioGridder server');
    }

    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const message = JSON.stringify({
        type: 'process_audio',
        instanceId,
        audioData: Array.from(audioData)
      });

      this.websocket.send(message);

      const handler = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.type === 'audio_processed' && response.instanceId === instanceId) {
          this.websocket?.removeEventListener('message', handler);
          resolve(new Float32Array(response.audioData));
        }
      };

      this.websocket.addEventListener('message', handler);

      setTimeout(() => {
        this.websocket?.removeEventListener('message', handler);
        reject(new Error('Timeout processing audio'));
      }, 5000);
    });
  }
}
