import { log } from '../utils.mjs';
export default {
    name: 'vanish',
    systems: ['vanish'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
            const system = client.getSystem('vanish');
            const userMessages = [...system.data.userMessages.entries()];
            log.info(JSON.stringify(userMessages, null, 2));
            for (const [userId, messages] of userMessages) {
                // TODO: how to get userid?
                // Check if this is the specific user ID you want (61528972)
                if (userId === "61528972") {
                    for (const message of messages) {
                        client.api.removeMessage(message.id);
                    }

                }
            }
        }
    },
};
