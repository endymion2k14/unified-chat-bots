import { Ollama } from 'ollama';
import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

const SOURCE = 'gptknows.mjs';

export default {
    name: 'gptknows',
    data: {},
    ollama: 0,
    model: 'gemma3:4b-it-qat',
    remembrance: 0,
    ROLES: {
        SYSTEM: 'system',
        USER: 'user',
        GPT: 'assistant'
    },

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('model'                  in config) { this.model  = config.model; }
        if ('host'                   in config) { this.ollama = new Ollama({ host: config.host }); }
        if ('remembrance'            in config) { this.remembrance = config.remembrance; }
        else { this.ollama = new Ollama(); }
        this.data[client.channel] = this.data[client.channel] || { live: false };
        client.api.addListener(EventTypes.stream_start, status => { if (this.data[client.channel].live) { return; } this.data[client.channel].live = true; });
        client.api.addListener(EventTypes.stream_end, status => { if (!this.data[client.channel].live) { return; } this.data[client.channel].live = false; this.data[client.channel].userMessages = {}; log.info(`Clearing GPTKnows information for channel ${client.channel}`); });
    },

    async getResponse(messages = []) {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, stream: false, messages: messages });
    }
}
