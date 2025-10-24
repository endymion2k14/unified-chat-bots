export default {
    name: 'lurk',
    systems: ['channelLive'],
    async reply(params, client, event) {
        const uptime = client.getSystem('channelLive');
        if (!uptime._live) { return; }
        client.sendMessage(`Thank you for lurking ${event.username}!`);
    }
}
