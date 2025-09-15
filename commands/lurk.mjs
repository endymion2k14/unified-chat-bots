export default {
    name: 'lurk',
    async reply(client, channel, userState, params, message) { client.sendMessage(`Thank you for lurking ${userState['display-name']}!`); }
}