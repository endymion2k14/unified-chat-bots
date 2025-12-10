export default {
    name: 'evade',
    async reply(params, client, event) {
        if (event.privileges.broadcaster || event.privileges.moderator) { client.sendMessage(`Broadcasters and Moderators cannot evade ${event.username}.`); return; }
        try { await client.api.timeoutUser(event.tags['user-id'], 1, 'Evade command used'); }
        catch (error) { }
    }
}
