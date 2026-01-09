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
        if (event.tags['msg-id'] !== 'ban_success' && event.tags['msg-id'] !== 'timeout_success') { return; }
        const username = event.username;
        if (!username) { log.warn(`Could not extract username from ban event: ${event.message}`, SOURCE); return; }
        const isPermanentBan = !('ban-duration' in event.tags);
        const banType = isPermanentBan ? 'banned' : 'timed out';
        const duration = event.tags['ban-duration'] ? `${event.tags['ban-duration']}s` : 'permanent';
        log.info(`${username} ${banType} (${duration}) in channel ${client.channel}`, SOURCE);
        if (isPermanentBan) { this.cleanupUser(client, username); }
    },

    cleanupUser(client, username) {
        const channel = client.channel;
        let cleanedSystems = [];
        for (const systemName of this.cleanup_systems) {
            try { const system = client.getSystem(systemName); if (system && typeof system.removeUser === 'function') { const wasCleaned = system.removeUser(channel, username); if (wasCleaned) { cleanedSystems.push(systemName); } } }
            catch (error) { log.error(`Error cleaning up user ${username} from system ${systemName}: ${error}`, SOURCE); }
        }
        if (this.log_cleanup && cleanedSystems.length > 0) { log.info(`Cleaned up ${username} from ${cleanedSystems.join(', ')} in channel ${channel}`, SOURCE); }
        else if (this.log_cleanup) { log.info(`No systems required cleanup for ${username} in channel ${channel}`, SOURCE); }
    }
};
