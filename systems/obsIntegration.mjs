import { log } from '../utils.mjs';

const SOURCE = 'OBS-Intergration';

export default {
    name: 'obsIntegration',
    enabled: false,
    integrations: [],

    init(client) {
        // Load configuration
        const settings = client.getSystemConfig(this.name);
        if ('enabled' in settings) { this.enabled = settings.enabled; }
        if ('integrations' in settings) { this.integrations = settings.integrations || []; }
        if (!this.enabled || this.integrations.length === 0) { log.info('OBS Integration disabled or no integrations configured', `${SOURCE}-${client._settings.name}`); return; }

        // Set up event listeners for each configured integration
        for (const integration of this.integrations) {
            if (!integration.event || !integration.actions || !Array.isArray(integration.actions)) { log.warn(`Invalid integration configuration: ${JSON.stringify(integration)}`, `${SOURCE}-${client._settings.name}`); continue; }
            client.on(integration.event, async (event) => { await this.handleEvent(client, integration, event); });
        }
        log.info(`OBS Integration loaded with ${this.integrations.length} integrations`, `${SOURCE}-${client._settings.name}`);
    },

    async handleEvent(client, integration, event) {
        if (!client.obsClients || client.obsClients.length === 0) { return; }

        for (const action of integration.actions) {
            try { await this.executeAction(client, action, event); }
            catch (error) { log.error(`Failed to execute OBS action: ${error.message}`, `${SOURCE}-${client._settings.name}`); }
        }
    },

    async executeAction(client, action, event) {
        const botIndex = action.botIndex || 0;
        if (botIndex < 0 || botIndex >= client.obsClients.length) { throw new Error(`Invalid bot index: ${botIndex}`); }
        const obsClient = client.obsClients[botIndex];
        let sceneName;
        let duration;

        switch (action.type) {
            case 'changeScene':
                if (!action.sceneName) { throw new Error('sceneName required for changeScene action'); }
                await obsClient.changeScene(action.sceneName);
                break;
            case 'setSourceEnabled':
                if (!action.sourceName) { throw new Error('sourceName required for setSourceEnabled action'); }
                sceneName = action.sceneName || await obsClient.getCurrentScene();
                const enabled = action.enabled !== false; // Default to true
                duration = action.duration || 0;
                await obsClient.setSourceEnabled(sceneName, action.sourceName, enabled, duration);
                break;
            case 'setTextSource':
                if (!action.sourceName) { throw new Error('sourceName required for setTextSource action'); }
                sceneName = action.sceneName || await obsClient.getCurrentScene();
                let text = action.text || '';
                // Replace placeholders with event data
                text = text.replace(/{user_name}/g, event.user_name || '');
                text = text.replace(/{user_login}/g, event.user_login || '');
                text = text.replace(/{display_name}/g, event.display_name || '');
                text = text.replace(/{viewer_count}/g, event.viewer_count || '');
                const delay = action.delay || 0;
                duration = action.duration || 0;
                const currentText = await obsClient.getTextSource(sceneName, action.sourceName);
                setTimeout(async () => {
                    await obsClient.setTextSource(sceneName, action.sourceName, text);
                    if (duration > 0) {
                        setTimeout(async () => {
                            await obsClient.setTextSource(sceneName, action.sourceName, currentText);
                        }, duration * 1000);
                    }
                }, delay * 1000);
                break;
            case 'setAudioMute':
                if (!action.sourceName) { throw new Error('sourceName required for setAudioMute action'); }
                const mute = action.mute === true;
                await obsClient.setAudioMute(action.sourceName, mute);
                break;
            case 'startRecording':
                await obsClient.startRecording();
                break;
            case 'stopRecording':
                await obsClient.stopRecording();
                break;
            case 'startStreaming':
                await obsClient.startStreaming();
                break;
            case 'stopStreaming':
                await obsClient.stopStreaming();
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
}
