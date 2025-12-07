import { concat, log } from '../utils.mjs';

const SOURCE = 'gptlurk.mjs';

const system_prompt = 'Provide a witty remark about their message, short and concise, without quotation marks.';

export default {
    name: 'gptlurk',
    systems: ['gpt'],
    async reply(params, client, event) {
        if (params.length > 0) {
            try {
                const system = client.getSystem('gpt');
                const response = await system.getResponse([ { role: system.ROLES.SYSTEM, content: system_prompt }, { role: system.ROLES.USER, content: concat(params, ' ') }]);
                client.sendMessage(`Thank you for lurking ${event.username}! ${response.message.content}`);
            } catch (err) {
                log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
            }
        } else { client.sendMessage(`Thank you for lurking ${event.username}!`); }
    }
}
