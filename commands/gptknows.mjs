import { concat, log, json } from '../utils.mjs';

const SOURCE = 'gptknows.mjs';

const system_prompt = 'Please answer the next question as short and concise as possible:';

export default {
    name: 'gptknows',
    aliases: ['god'],
    system: ['gptknows'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
            if (params.length > 0) {
                try {
                    const system = client.getSystem('gptknows');
                    // Ensure the array exists for the specific username
                    if (!system.data[client.channel].userMessages) { system.data[client.channel].userMessages = {}; }
                    // If userMessages[event.username] doesn't exist, initialize it as an empty array
                    const userMessages = system.data[client.channel].userMessages;
                    if (!Array.isArray(userMessages[event.username])) { userMessages[event.username] = []; }
                    // Combine the parameters into a single string
                    const userInput = concat(params, ' ');
                    // Prepare the messages to be sent to the AI system
                    const messagesToAI = [ { role: system.ROLES.SYSTEM, content: system_prompt } ];
                    // Add previous user and AI messages to the context
                    for (const message of userMessages[event.username]) {
                        messagesToAI.push({ role: system.ROLES.USER, content: message.message });
                        if (message.response) { messagesToAI.push({ role: system.ROLES.GPT, content: message.response }); }
                    }
                    // Add the new user input to the context
                    messagesToAI.push({ role: system.ROLES.USER, content: userInput });
                    //console.log(messagesToAI);
                    // Fetch the response from the AI
                    const response = await system.getResponse(messagesToAI);
                    // Send response to client
                    client.sendMessage(response.message.content);
                    // Prepare the new message object with the user input and the AI's response
                    const newMessage = { message: userInput, response: response.message.content };
                    // Add the new message to the user's messages array
                    userMessages[event.username].push(newMessage);
                    // Trim the array to ensure it does not exceed system.remembrance
                    if (userMessages[event.username].length > system.remembrance) { userMessages[event.username] = userMessages[event.username].slice(-system.remembrance); }
                    // Log the updated messages for debugging or other purposes
                    //console.log('Updated user messages for', event.username, ':', JSON.stringify(userMessages[event.username], null, 2));
                } catch (err) {
                    log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                    client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
                }
            } else { client.sendMessage('You need to specify a prompt for the gpt to be able to reply to.'); }
            } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    }
}
