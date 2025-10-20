export default {
    name: 'debugrecap',
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator) {
            // gptrecap Debugging
            const gptrecap = client.getSystem('gptrecap');
            if (gptrecap && gptrecap.data) {
                 for (const key in gptrecap.data) {
                    console.log(gptrecap.data[key]);
                 }
            } else { console.log('The gptrecap data is not available.'); }
        } else { client.sendMessage(`You need to be at least a moderator to use this command ${event.username}.`); }
    },
};
