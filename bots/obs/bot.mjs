import OBSWebSocket from 'obs-websocket-js';
import { EventEmitter } from 'node:events';
import { log } from '../../utils.mjs';

const SOURCE = 'OBS-Intergration';

export class ClientOBS extends EventEmitter {
    constructor(settings) {
        super();

        this._settings = settings;
        this.obs = new OBSWebSocket();
        this.connected = false;
        this.reconnecting = false;
        this.retryDelay = 1000;
        this.maxRetryDelay = 30000;

        // Set up event listeners once
        this.obs.on('ConnectionOpened', () => this.emit('connect'));
        this.obs.on('ConnectionClosed', () => { this.connected = false; this.emit('disconnect'); this.reconnect(); });
        this.obs.on('ConnectionError', () => this.reconnect());
        this.obs.on('CurrentSceneChanged', (data) => this.emit('sceneChanged', data));
        this.obs.on('RecordingStarted', () => this.emit('recordingStarted'));
        this.obs.on('RecordingStopped', () => this.emit('recordingStopped'));
        // Add more events as needed
    }

    async connect() {
        try {
            const { host = 'localhost', port = 4455, password } = this._settings.settings || {};
            await this.obs.connect(`ws://${host}:${port}`, password);
            this.connected = true;
            log.info('Connected to OBS', `${SOURCE}-${this._settings.name}`);
        } catch (error) {
            log.error(`Failed to connect to OBS: ${error}`, `${SOURCE}-${this._settings.name}`);
            this.reconnect();
        }
    }

    async reconnect() {
        if (this.reconnecting || this.connected) return;
        this.reconnecting = true;
        try {
            await this.connect();
            this.reconnecting = false;
            this.retryDelay = 1000;
        } catch (error) {
            log.error(`Reconnect failed, retrying in ${this.retryDelay}ms: ${error}`, `${SOURCE}-${this._settings.name}`);
            setTimeout(() => {
                this.reconnecting = false;
                this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
                this.reconnect();
            }, this.retryDelay);
        }
    }

    async changeScene(sceneName) {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
        } catch (error) {
            throw new Error(`Failed to change scene: ${error.message}`);
        }
    }

    async getCurrentScene() {
        if (!this.connected) return null;
        try {
            const response = await this.obs.call('GetCurrentProgramScene');
            return response.currentProgramSceneName;
        } catch (error) {
            log.error(`Failed to get current scene: ${error}`, `${SOURCE}-${this._settings.name}`);
            return null;
        }
    }

    async setSourceEnabled(sceneName, sourceName, enabled, duration = 0) {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            const idResponse = await this.obs.call('GetSceneItemId', { sceneName, sourceName });
            const sceneItemId = idResponse.sceneItemId;
            await this.obs.call('SetSceneItemEnabled', {
                sceneName,
                sceneItemId,
                sceneItemEnabled: enabled
            });
            if (duration > 0) {
                setTimeout(async () => {
                    await this.obs.call('SetSceneItemEnabled', {
                        sceneName,
                        sceneItemId,
                        sceneItemEnabled: !enabled
                    });
                }, duration * 1000);
            }
        } catch (error) {
            throw new Error(`Failed to set source enabled: ${error.message}`);
        }
    }

    async getStreamStats() {
        if (!this.connected) return null;
        try {
            const response = await this.obs.call('GetStreamStatus');
            return response;
        } catch (error) {
            log.error(`Failed to get stream stats: ${error}`, `${SOURCE}-${this._settings.name}`);
            return null;
        }
    }

    async setTextSource(sceneName, sourceName, text) {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('SetInputSettings', { inputName: sourceName, inputSettings: { text } });
        } catch (error) {
            throw new Error(`Failed to set text source: ${error.message}`);
        }
    }



    async startRecording() {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('StartRecord');
        } catch (error) {
            throw new Error(`Failed to start recording: ${error.message}`);
        }
    }

    async stopRecording() {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('StopRecord');
        } catch (error) {
            throw new Error(`Failed to stop recording: ${error.message}`);
        }
    }

    async startStreaming() {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('StartStream');
        } catch (error) {
            throw new Error(`Failed to start streaming: ${error.message}`);
        }
    }

    async stopStreaming() {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('StopStream');
        } catch (error) {
            throw new Error(`Failed to stop streaming: ${error.message}`);
        }
    }

    async setAudioMute(sourceName, mute) {
        if (!this.connected) throw new Error('OBS not connected');
        try {
            await this.obs.call('SetInputMute', { inputName: sourceName, inputMuted: mute });
        } catch (error) {
            throw new Error(`Failed to set audio mute: ${error.message}`);
        }
    }

    // Only essential methods kept
}
