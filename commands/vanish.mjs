export default {
    name: 'vanish',
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
                if (event.privileges.broadcaster || event.privileges.moderator) { client.sendMessage(`Streamers and Moderators are unable to vanish themselves.`); return; }
                const messages = await client.api.fetchMessagesFromUser(client, event);
                for (const message of messages) { client.api.removeMessage(message.id); }
        } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    },
};
