import { randomInt } from '../utils.mjs';

export default {
    name: 'smurt',
    systems: ['channelLive'],
    async reply(params, client, event) {
        if (!client.getSystem('channelLive')._live) { return; }
        const messages = client.getCommandConfig(this.name);
        if (messages.length > 0) { client.sendMessage(messages[randomInt(0,  messages.length)]); }
        else { client.sendMessage('Smurt!'); }
    }
}
