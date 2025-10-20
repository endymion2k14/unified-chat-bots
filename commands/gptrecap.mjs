import { log } from '../utils.mjs';

const SOURCE = 'gptrecap.mjs';

const system_prompt = 'Please give a recap as short and concise as possible:';

export default {
    name: 'gptrecap',
    systems: ['gptrecap'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator) {
            try {
                const system = client.getSystem('gptrecap');
                const channelData = system.data[client.channel];
                const chatHistory = channelData.chatMessages.map(msg => {
                    const [username, message] = msg.split(': ');
                    return { username, message };
                }).map(item => `${item.username}: ${item.message}`).join('\n');
                const response = await system.getResponse([
                    { role: system.ROLES.SYSTEM, content: system_prompt },
                    { role: system.ROLES.USER, content: chatHistory }]);
                client.sendMessage(response.message.content);
            } catch (err) {
                log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
            }
        } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    }
}
