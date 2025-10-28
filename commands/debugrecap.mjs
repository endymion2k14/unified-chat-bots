export default {
    name: 'debugrecap',
    aliases: ['dr'],
    system: ['gptrecap'],
    hidden: true,
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator) {
            // Recap Debugging
            const gptrecap = client.getSystem('gptrecap');
            const channelData = gptrecap && gptrecap.data ? gptrecap.data[event.channel] : null;
            if (channelData) {
                const userMessages = channelData.userMessages;
                if (typeof userMessages === 'object' && userMessages !== null) {
                    for (const username in userMessages) {
                        if (userMessages.hasOwnProperty(username)) {
                            const messagesArray = userMessages[username];
                            if (Array.isArray(messagesArray)) {
                                console.log(`Channel: ${event.channel}, Username: ${username}`, messagesArray);
                            }
                        }
                    }
                }
            } else {
                console.log('The recap data for this channel is not available or the channel is invalid.');
            }
        } else {
            client.sendMessage(`You need to be at least a moderator to use this command, ${event.username}.`);
        }
    },
};
