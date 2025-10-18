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
                const userMessages = system.data.userMessages;
                log.info(userMessages);
        }
    },
};
