import { randomInt } from '../utils.mjs';

export default {
    name: 'smurt',
    systems: ['channelLive'],
    async reply(params, client, event) {
        const uptime = client.getSystem('channelLive');
        if (!uptime._live) { return; }
        const messages = client.getCommandConfig(this.name);
        if (messages.length > 0) { client.sendMessage(messages[randomInt(0,  messages.length)]); }
        else { client.sendMessage('Smurt!'); }
    }
};
