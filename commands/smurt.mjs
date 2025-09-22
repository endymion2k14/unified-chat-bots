import { randomInt } from '../utils.mjs';

export default {
    name: 'smurt',
    async reply(params, client, event) {
        const messages = client.getCommandConfig(name);
        if (messages.length > 0) { client.sendMessage(messages[randomInt(0,  messages.length)]); }
        else { client.sendMessage("Smurt!"); }
    }
};