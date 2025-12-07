import { concat, log } from '../utils.mjs';

const SOURCE = 'gpt.mjs';

const system_prompt = 'You are a concise chat assistant for Twitch chat.\n' +
                      'Your purpose is to provide brief, direct answers in 1-2 sentences under 100 characters.\n' +
                      'Do not engage in creative writing, storytelling, or meta-discussion.\n' +
                      'Be helpful but extremely brief.';

export default {
    name: 'gpt',
    systems: ['gpt'],
    async reply(params, client, event) {
        if (event.privileges.super || event.privileges.broadcaster || event.privileges.moderator || event.privileges.subscriber || event.privileges.vip) {
            if (params.length > 0) {
                try {
                    const system = client.getSystem('gpt');
                    const response = await system.getResponse([ { role: system.ROLES.SYSTEM, content: system_prompt }, { role: system.ROLES.USER, content: concat(params, ' ') }]);
                    client.sendMessage(response.message.content);
                } catch (err) {
                    log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                    client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
                }
            } else { client.sendMessage('You need to specify a prompt for the gpt to be able to reply to.'); }
        } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    }
}
