import { log } from '../utils.mjs';
export default {
    name: 'vanish',
    systems: ['vanish'],
    async reply(params, client, event) {
        if (event.privileges.broadcaster || event.privileges.moderator) { client.sendMessage(`Broadcasters and Moderators cannot vanish themselves ${event.username}.`); return; }
        const system = client.getSystem('vanish');
        const userMessages = [...system.data.userMessages.entries()];
        const userId = await client.api.getUserId(event.username);
        for (const [id, messageid] of userMessages) {
            if (id === userId) { for (const message of messages) { client.api.removeMessage(message.id); } system.data.userMessages.delete(userId); break; }
        }
    },
};
