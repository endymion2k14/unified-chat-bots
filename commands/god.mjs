import { concat, log, json } from '../utils.mjs';

const SOURCE = 'god.mjs';

const system_prompt = 'Please answer the next question as short and concise as possible:';

export default {
    name: 'god',
    system: ['gpt'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
            if (params.length > 0) {
                try {
                    const system = client.getSystem('gpt');

                    // Check if file exists, if not user is new to gpt and a file will be created.
                    if (!json.exists(`./gptdata/${client._settings.name}-${client._settings.settings.channel}-${event.username}.json`)) {
                        json.save(`./gptdata/${client._settings.name}-${client._settings.settings.channel}-${event.username}.json`, []);
                    }
                    // Load the json and responses
                    // TODO: can we somehow not load it all depending on the remembrance? seems like if the file is large itll load/unload memory a lot?
                    let gptUserData = json.load(`./gptdata/${client._settings.name}-${client._settings.settings.channel}-${event.username}.json`);
                    // Only use last "remembrance" which is default 0, knows nothing, vs 5 (for me), knows 5 previous questions/responses
                    if (gptUserData.length > system.remembrance) {
                        gptUserData = gptUserData.slice(-system.remembrance);
                    }
                    let messages = [];
                    for (const item of gptUserData) {
                        // Add previous questions and responses - cut previously with remembrance
                        const { question, response } = item;
                        messages.push({ role: system.ROLES.USER, content: question });
                        messages.push({ role: system.ROLES.GPT, content: response });
                    }
                    // Ninja juju to make the messages correct for GPT. Place the role and prompt at the top, place the messages in correct order below.
                    messages.unshift({ role: system.ROLES.SYSTEM, content: system_prompt });
                    messages.push({ role: system.ROLES.USER, content: concat(params, ' ') });

                    // Await Response
                    const response = await system.getResponse(messages);

                    // Asuming Response went correct and didnt trigger the catch, we write the question and response from the user to the correct file.
                    const data = {
                        created_at: new Date().toISOString(),
                        question: concat(params, ' '),
                        response: response.message.content
                    };
                    json.append(`./gptdata/${client._settings.name}-${client._settings.settings.channel}-${event.username}.json`, data);

                    client.sendMessage(response.message.content);
                } catch (err) {
                    log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                    client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
                }
            } else { client.sendMessage('You need to specify a prompt for the gpt to be able to reply to.'); }
            } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    }
}
