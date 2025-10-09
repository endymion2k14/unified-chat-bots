import { concat, equals, log } from '../utils.mjs';

const SOURCE = 'gptimage.mjs';

// TODO: Test url: https://static-cdn.jtvnw.net/previews-ttv/live_user_[streamer]-1920x1080.jpg
const system_prompt = 'Please describe this image as short and concise as possible:';

export default {
    name: 'gptimage',
    systems: ['gptimage', 'channelLive'],
    async reply(params, client, event) {
        if (event.privileges.super       ||
            event.privileges.broadcaster ||
            event.privileges.moderator   ||
            event.privileges.subscriber  ||
            event.privileges.vip) {
            if (params.length > 0) {
                try {
                    const system = client.getSystem('gptimage');
                    const messages = [];
                    if (equals(params[0].toLowerCase(), 'live')) {
                        const uptime = client.getSystem('channelLive');
                        if (!uptime._live) {
                            return client.sendMessage('Stream is currently offline.');
                        }
                        log.info("Grabbing live image", SOURCE);
                        // Pick your best image to get based on your 'performance'
                        // Possible images: 1920x1080, 1280x720, 800x450, 440x248, 320x180
                        // Date.now so it cannot 'pre cache' the image - has to be refreshed by Twitch
                        const base64Image = await system.urlToBase64(`https://static-cdn.jtvnw.net/previews-ttv/live_user_${client._settings.settings.channel}-1920x1080.jpg?t=${Date.now()}`);
                        messages.push({ role: system.ROLES.USER, content: system_prompt, images: [base64Image] });
                    } else if (params[0].startsWith('http')) {
                        log.info("Grabbing image from URL", SOURCE);
                        const base64Image = await system.urlToBase64(params[0]);
                        messages.push({ role: system.ROLES.USER, content: system_prompt, images: [base64Image] });
                    } else {
                        return client.sendMessage('Invalid input. Please provide a valid live keyword or image URL.');
                    }
                    const response = await system.getResponse(messages);
                    client.sendMessage(response.message.content);
                } catch (err) {
                    log.error(`Something went wrong trying to get the response from the GPT: ${err}`, SOURCE);
                    client.sendMessage(`Something went wrong trying to get a response from the GPT ${event.username}.`);
                }
            } else { client.sendMessage('You need to specify a prompt for the gpt to be able to reply to.'); }
        } else { client.sendMessage(`You need to be at least a subscriber or VIP to use this command ${event.username}.`); }
    }
}
