export default {
    name: 'vanish',
    systems: ['vanish'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
                if (event.privileges.broadcaster || event.privileges.moderator) { client.sendMessage(`Streamers and Moderators are unable to vanish themselves.`); return; }
                const system = client.getSystem('vanish');
                const userMessages = system.data.userMessages.get(event.userId);
                if (userMessages && userMessages.length > 0) { const messageToRemove = userMessages.shift(); if (messageToRemove && messageToRemove.id) { client.api.removeMessage(messageToRemove.id); } }
        } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    },
};
