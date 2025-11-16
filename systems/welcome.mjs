import { EventTypes } from '../bots/twitch/irc.mjs';
import { equals, randomInt } from '../utils.mjs';

export default {
    name: 'welcome',
    chatted: [],

    init(client) {
        client.addListener(EventTypes.message, event => this.welcome(client, event));
        client.api.addListener(EventTypes.stream_start, () => { this.chatted = []; });
        client.api.addListener(EventTypes.stream_end, () => { this.chatted = []; });
        this.config = client.getSystemConfig(this.name);
    },

    welcome(client, event) {
        if (event.tags['first-msg'] !== '0') { this.reply(client, this.config.first[randomInt(0, this.config.first.length)], event.username); }
        else {
            for (let i = 0; i < this.chatted.length; i++) { if (equals(this.chatted[i], event.identity)) { return; } }
            this.reply(client, this.config.back[randomInt(0, this.config.back.length)], event.username);
        }
    },

    reply(client, message, user) {
        client.sendMessage(message.replaceAll('{USER}', user));
        this.chatted.push(user.toLowerCase());
    }
}
