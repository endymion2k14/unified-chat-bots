export default {
    name: 'lurk',
    async reply(params, client, event) { client.sendMessage(`Thank you for lurking ${userState['display-name']}!`); }
}