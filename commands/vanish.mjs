import { log } from '../utils.mjs';
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
                console.log(`User ID: ${userId}`);
                userMessages.forEach(message => {
                    console.log(`Message ID: ${message.id}`);
                //     client.api.removeMessage(`${message.id}`).then(() => {
                //         system.data[client.channel].userMessages[userId] = userMessages.filter(msg => msg.id !== message.id);
                //     }).catch(error => {
                //         console.error(`Failed to remove message with ID ${message.id}:`, error);
                //     });
                // });
            } else {
                console.log('No messages found for this user.');
            }
        } else {
            console.log('No user messages available for this channel.');
        }
    },
};
