import { Ollama } from 'ollama';

export default {
    name: 'gptrecap',
    ollama: 0,
    model: 'gemma3:4b-it-qat',
    max_messages: 0,
    chatMessages: [],
    ROLES: {
        SYSTEM: 'system',
        USER: 'user',
        GPT: 'assistant'
    },

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('model'        in config) { this.model  = config.model; }
        if ('max_messages' in config) { this.max_messages  = config.max_messages; }
        if ('host'         in config) { this.ollama = new Ollama({ host: config.host }); }
        else { this.ollama = new Ollama(); }
        client.on('message', (event) => {
            if (this.chatMessages.length >= this.max_messages) {
                this.chatMessages.shift();
            }
            this.chatMessages.push(`${event.username}: ${event.message}`);
        });
    },

    async getResponse(messages = []) {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, stream: false, messages: messages });
    }
}
