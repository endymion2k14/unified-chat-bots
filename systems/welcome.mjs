import { EventTypes } from '../bots/twitch/irc.mjs';
import { equals, randomInt } from '../utils.mjs';

export default {
    name: 'welcome',
    chatted: [],
    lastLiveCheck: false,
    pendingWelcomes: new Map(),

    init(client) {
        client.addListener(EventTypes.message, event => this.welcome(client, event));
        client.addListener(EventTypes.ban, event => { const timeoutId = this.pendingWelcomes.get(event.username); if (timeoutId) { clearTimeout(timeoutId); this.pendingWelcomes.delete(event.username); } });
        client.api.addListener(EventTypes.stream_start, () => { if (!this.lastLiveCheck) { this.chatted = []; this.pendingWelcomes.clear(); this.lastLiveCheck = true; } });
        client.api.addListener(EventTypes.stream_end, () => { if (this.lastLiveCheck) { this.chatted = []; this.pendingWelcomes.clear(); this.lastLiveCheck = false; } });
        this.config = client.getSystemConfig(this.name);
        this.welcomeDelay = (this.config.welcomeDelay || 1) * 1000;
    },

    welcome(client, event) {
        if (event.tags['first-msg'] !== '0') {
            const timeoutId = setTimeout(() => {
                this.reply(client, this.config.first[randomInt(0, this.config.first.length)], event.username);
                this.pendingWelcomes.delete(event.username);
            }, this.welcomeDelay);
            this.pendingWelcomes.set(event.username, timeoutId);
        }
        else {
            for (let i = 0; i < this.chatted.length; i++) { if (equals(this.chatted[i], event.identity)) { return; } }
            this.reply(client, this.config.back[randomInt(0, this.config.back.length)], event.username);
        }
    },

    reply(client, message, user) { client.sendMessage(message.replaceAll('{USER}', user)); this.chatted.push(user.toLowerCase()); },

    removeUser(channel, username) { const index = this.chatted.indexOf(username.toLowerCase()); if (index !== -1) { this.chatted.splice(index, 1); return true; } return false; }
}
