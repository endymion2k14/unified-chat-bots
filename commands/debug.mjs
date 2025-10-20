export default {
    name: 'debug',
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator) {
            // Vanish Debugging
            const vanish = client.getSystem('vanish');
            if (vanish && vanish.data) {
                for (const key in vanish.data) {
                    if (vanish.data.hasOwnProperty(key)) {
                        const userMessages = vanish.data[key].userMessages;
                        if (typeof userMessages === 'object' && userMessages !== null) {
                            for (const messageId in userMessages) {
                                if (userMessages.hasOwnProperty(messageId)) {
                                    const messagesArray = userMessages[messageId];
                                    if (Array.isArray(messagesArray)) {
                                        console.log(`Channel: ${key}, Messages for ID: ${messageId}`, messagesArray);
                                    }
                                }
                            }
                        }
                    }
                }
            } else { console.log('The vanish data is not available.'); }
        } else { client.sendMessage(`You need to be at least a moderator to use this command ${event.username}.`); }
    },
};




