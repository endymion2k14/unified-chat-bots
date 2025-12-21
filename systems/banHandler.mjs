import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

const SOURCE = 'banHandler.mjs';

export default {
    name: 'banHandler',
    enabled: false,
    cleanup_systems: [],
    log_cleanup: false,

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('enabled' in config) { this.enabled = config.enabled; }
        if ('cleanup_systems' in config) { this.cleanup_systems = config.cleanup_systems; }
        if ('log_cleanup' in config) { this.log_cleanup = config.log_cleanup; }
        if (!this.enabled) { log.info(`Ban handler disabled for channel ${client.channel}`, SOURCE); return; }
        client.addListener(EventTypes.ban, event => this.handleBan(client, event));
        log.info(`Ban handler initialized for channel ${client.channel} with systems: ${this.cleanup_systems.join(', ')}`, SOURCE);
    },

    handleBan(client, event) {
        if (event.tags['msg-id'] !== 'ban_success') { return; }
        const username = event.message.split(' ')[0];
        if (!username) { log.warn(`Could not extract username from ban event: ${event.message}`, SOURCE); return; }
        this.cleanupUser(client, username);
    },

    cleanupUser(client, username) {
        const channel = client.channel;
        let cleanedSystems = [];
        for (const systemName of this.cleanup_systems) {
            try { const system = client.getSystem(systemName); if (system && typeof system.removeUser === 'function') { const wasCleaned = system.removeUser(channel, username); if (wasCleaned) { cleanedSystems.push(systemName); } } }
            catch (error) { log.error(`Error cleaning up user ${username} from system ${systemName}: ${error}`, SOURCE); }
        }
        if (this.log_cleanup && cleanedSystems.length > 0) { log.info(`Cleaned up ${username} from ${cleanedSystems.join(', ')} in channel ${channel}`, SOURCE); }
    }
};
