import { EventTypes } from '../bots/twitch/irc.mjs';
import { equals, log } from '../utils.mjs';

export default {
    name: 'personGreeter',
    spoken: [],

    init(client) {
        this.config = client.getSystemConfig(this.name);
        if (!this.config.enabled || !this.config.users) { return; }

        client.addListener(EventTypes.message, event => this.checkGreeting(client, event));
        client.api.addListener(EventTypes.stream_start, () => { this.spoken = []; });
        client.api.addListener(EventTypes.stream_end, () => { this.spoken = []; });
    },

    checkGreeting(client, event) {
        const user = event.username.toLowerCase();
        if (!(user in this.config.users)) { return; }
        if (this.spoken.includes(user)) { return; }
        if (!client.getSystem('channelLive').isLive(client.channel)) { return; }

        const greetingEvent = {
            user_name: event.username,
            user_login: event.username,
            display_name: event.display_name || event.username,
            sourceName: this.config.users[user].sourceName,
            delay: this.config.users[user].delay,
            duration: this.config.users[user].duration
        };
        client.emit('personGreet', greetingEvent);

        this.spoken.push(user);
    }
}
