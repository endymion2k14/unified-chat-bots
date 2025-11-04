import { concat, log } from '../utils.mjs';

const SOURCE = 'gptlurk.mjs';

const system_prompt = 'Give a witty response about their message as short and concise as possible:';

export default {
    name: 'gptlurk',
    systems: ['gpt', 'channelLive'],
    async reply(params, client, event) {
        if (!client.getSystem('channelLive')._live) { return; }
        if (params.length > 0) {
            try {
                const system = client.getSystem('gpt');
                const response = await system.getResponse([
                    { role: system.ROLES.SYSTEM, content: system_prompt },
                    { role: system.ROLES.USER, content: concat(params, ' ') }]);
                client.sendMessage(`Thank you for lurking ${event.username}! ${response.message.content}`);
            } catch (err) {
                log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
            }
        } else { client.sendMessage(`Thank you for lurking ${event.username}!`); }
    }
}
