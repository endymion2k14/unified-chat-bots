import { EventTypes } from "../bots/twitch/irc.mjs";
import { equals, randomInt } from "../utils.mjs";

export default {
    name: 'welcome',
    init(client) {
        client.addListener(EventTypes.message, event => this.welcome(client, event));
        // TODO: implement stream shutdown/start resetting the chatted array
        this.config = client.getSystemConfig(name);
    },
    chatted: [],
    welcome(client, event) {
        const user = event.username.toLowerCase();
        if (event.tags['first-msg']) {
            client.sendMessage(this.config.first[randomInt(0, this.config.first.length)].replaceAll('{USER}', event.username));
            this.chatted.push(user);
        }
        else {
            for (let i = 0; i < this.chatted.length; i++) {
                if (equals(this.chatted[i], user)) { return; } // Return if user has already chatted
            }
            client.sendMessage(this.config.back[randomInt(0, this.config.back.length)].replaceAll('{USER}', event.username));
            this.chatted.push(user);
        }
    }
}