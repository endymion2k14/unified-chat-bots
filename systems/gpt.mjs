import { Ollama } from 'ollama';

export default {
    name: 'gpt',
    ollama: 0,

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('host' in config) { this.ollama = new Ollama({ host: config.host }); }
        else { this.ollama = new Ollama(); }
    },

    async getResponse(prompt = '') {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: '', messages: [{ role: 'user', content: prompt }], stream: false });
    }
}