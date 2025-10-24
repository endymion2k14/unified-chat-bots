export default {
    name: 'discord',
    systems: ['channelLive'],
    async reply(params, client, event) {
        const uptime = client.getSystem('channelLive');
        if (!uptime._live) { return; }
        client.sendMessage(client.getCommandConfig(this.name));
    },
};
