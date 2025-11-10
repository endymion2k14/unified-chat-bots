import OBSWebSocket from 'obs-websocket-js';
import { EventEmitter } from 'node:events';
import { log } from '../../utils.mjs';

const SOURCE = 'OBS';

export class ClientOBS extends EventEmitter {
    constructor(settings) {
        super();

        this._settings = settings;
        this.obs = new OBSWebSocket();
        this.connected = false;
    }

    async connect() {
        try {
            const { host = 'localhost', port = 4455, password } = this._settings.settings || {};
            await this.obs.connect(`ws://${host}:${port}`, password);
            this.connected = true;
            log.info('Connected to OBS', `${SOURCE}-${this._settings.name}`);

            // Set up event listeners
            this.obs.on('ConnectionOpened', () => this.emit('connect'));
            this.obs.on('ConnectionClosed', () => { this.connected = false; this.emit('disconnect'); });
            this.obs.on('CurrentSceneChanged', (data) => this.emit('sceneChanged', data));
            this.obs.on('RecordingStarted', () => this.emit('recordingStarted'));
            this.obs.on('RecordingStopped', () => this.emit('recordingStopped'));
            // Add more events as needed
        } catch (error) {
            log.error(`Failed to connect to OBS: ${error}`, `${SOURCE}-${this._settings.name}`);
        }
    }

    async changeScene(sceneName) {
        if (!this.connected) return;
        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
        } catch (error) {
            log.error(`Failed to change scene: ${error}`, `${SOURCE}-${this._settings.name}`);
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
        if (!this.connected) return;
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
            log.error(`Failed to set source enabled: ${error}`, `${SOURCE}-${this._settings.name}`);
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

    // Only essential methods kept
}
