import { EventTypes } from "../bots/twitch/irc.mjs";
import { equals } from "../utils.mjs";

export default {
    name: 'welcome',
    init(client) {
        client.addListener(EventTypes.message, event => this.welcome(client, event));
        // TODO: implement stream shutdown/start resetting the chatted array
        // TODO: implement custom messages
    },
    chatted: [],
    welcome(client, event) {
        const user = event.username.toLowerCase();
        if (event.tags['first-msg']) {
            client.sendMessage(`Welcome to the channel ${event.username}!`);
            this.chatted.push(user);
        }
        else {

            for (let i = 0; i < this.chatted.length; i++) {
                if (equals(this.chatted[i], user)) { return; } // Return if user has already chatted
            }
            client.sendMessage(`Welcome back ${event.username}!`);
            this.chatted.push(user);
        }
    }
}