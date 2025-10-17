import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

export default {
    name: 'vanish',
    data: {},
    init(client) {
    client.on('message', (event) => { });
    },
}
