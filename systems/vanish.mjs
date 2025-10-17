import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

export default {
    name: 'vanish',
    data: {},
    init(client) {
        if (!this.data.userMessages) { this.data.userMessages = new Map(); }
        client.on('message', (event) => {
            const userId = event.tags['user-id'];
            const messageId = event.tags.id;
            if (!this.data.userMessages.has(userId)) { this.data.userMessages.set(userId, []); }
            this.data.userMessages.get(userId).push({ id: messageId });
        });
    },
}
