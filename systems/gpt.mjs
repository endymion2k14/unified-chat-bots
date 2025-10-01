import { Ollama } from 'ollama';

export default {
    name: 'gpt',
    ollama: 0,
    model: 'gemma3:4b-it-qat',

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('model' in config) { this.model  = config.model; }
        if ('host'  in config) { this.ollama = new Ollama({ host: config.host }); }
        else { this.ollama = new Ollama(); }
    },

    async getResponse(prompt = '') {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, messages: [{ role: 'user', content: prompt }], stream: false });
    }
}