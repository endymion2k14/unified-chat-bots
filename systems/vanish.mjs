import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

const SOURCE = 'vanish.mjs';

export default {
    name: 'vanish',
    data: {},
    init(client) {
        this.data[client.channel] = this.data[client.channel] || { live: false, userMessages: {} };
        client.api.addListener(EventTypes.stream_start, status => { if (this.data[client.channel].live) { return; } this.data[client.channel].live = true; this.data[client.channel].userMessages = {}; });
        client.api.addListener(EventTypes.stream_end, status => { if (!this.data[client.channel].live) { return; } this.data[client.channel].live = false; this.data[client.channel].userMessages = {}; });
        client.on('message', (event) => {
            const messageId = event.tags.id;
            this.data[client.channel].userMessages[event.tags['user-id']] = this.data[client.channel].userMessages[event.tags['user-id']] || [];
            this.data[client.channel].userMessages[event.tags['user-id']].push({ id: messageId });
        });
    },
}

