export default {
    name: 'debugvanish',
    aliases: ['dv'],
    system: ['vanish'],
    hidden: true,
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator) {
            // Vanish Debugging
            const vanish = client.getSystem('vanish');
            const channelData = vanish && vanish.data ? vanish.data[event.channel] : null;
            if (channelData) {
                const userMessages = channelData.userMessages;
                if (typeof userMessages === 'object' && userMessages !== null) {
                    for (const messageId in userMessages) {
                        if (userMessages.hasOwnProperty(messageId)) {
                            const messagesArray = userMessages[messageId];
                            if (Array.isArray(messagesArray)) {
                                console.log(`Channel: ${event.channel}, Messages for ID: ${messageId}`, messagesArray);
                            }
                        }
                    }
                }
            } else {
                console.log('The vanish data for this channel is not available or the channel is invalid.');
            }
        } else {
            client.sendMessage(`You need to be at least a moderator to use this command, ${event.username}.`);
        }
    },
}