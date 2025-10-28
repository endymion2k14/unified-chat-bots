import { Ollama } from 'ollama';

export default {
    name: 'gptimage',
    ollama: 0,
    model: 'gemma3:4b-it-qat',
    resolution: '1280x720',
    ROLES: {
        USER: 'user'
    },

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('model'      in config) { this.model  = config.model; }
        if ('host'       in config) { this.ollama = new Ollama({ host: config.host }); }
        if ('resolution' in config) { this.resolution = config.resolution; }
        else { this.ollama = new Ollama(); }
    },

    async getResponse(messages = []) {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, stream: false, messages: messages });
    }
}
