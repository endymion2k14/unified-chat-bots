import { log } from '../utils.mjs';

const SOURCE = 'vanish.mjs';

export default {
    name: 'vanish',
    systems: ['vanish'],
    async reply(params, client, event) {
        if (event.privileges.broadcaster || event.privileges.moderator) { client.sendMessage(`Broadcasters and Moderators cannot vanish themselves ${event.username}.`); return; }
        const system = client.getSystem('vanish');
        if (system.data[client.channel] && system.data[client.channel].userMessages) {
            const userId = event.tags['user-id'];
            const userMessages = system.data[client.channel].userMessages[userId];
            if (userMessages) {
                log.info(`User ID: ${userId}`, SOURCE);
                userMessages.forEach(message => {
                    log.info(`Message ID: ${message.id}`, SOURCE);
                //     client.api.removeMessage(`${message.id}`).then(() => {
                //         system.data[client.channel].userMessages[userId] = userMessages.filter(msg => msg.id !== message.id);
                //     }).catch(error => {
                //         console.error(`Failed to remove message with ID ${message.id}:`, error);
                //     });
                // });
            } else {
                log.warn('No messages found for this user.', SOURCE);
            }
        } else {
            log.warn('No user messages available for this channel.', SOURCE);
        }
    },
};
