export default {
    name: 'lurk',
    systems: ['channelLive'],
    async reply(params, client, event) { if (!client.getSystem('channelLive')._live) { return; } client.sendMessage(`Thank you for lurking ${event.username}!`); }
}
