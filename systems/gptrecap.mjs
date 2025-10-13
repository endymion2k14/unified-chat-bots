import { Ollama } from 'ollama';

export default {
    name: 'gptrecap',
    ollama: 0,
    model: 'gemma3:4b-it-qat',
    max_messages: 0,
    message_limit_per_user: 0,
    message_time_window: 60000,
    userMessageCount: {},
    chatMessages: [],
    ROLES: {
        SYSTEM: 'system',
        USER: 'user',
        GPT: 'assistant'
    },

    init(client) {
        const config = client.getSystemConfig(this.name);
        if ('model'                  in config) { this.model  = config.model; }
        if ('max_messages'           in config) { this.max_messages  = config.max_messages; }
        if ('message_limit_per_user' in config) { this.message_limit_per_user  = config.message_limit_per_user; }
        if ('message_time_window'    in config) { this.message_time_window  = config.message_time_window; }
        if ('host'                   in config) { this.ollama = new Ollama({ host: config.host }); }
        else { this.ollama = new Ollama(); }
        // TODO: how to get emit that we went offline, so we can reset chatMessages and userMessageCount?
        client.on('message', (event) => {
            const currentTime = Date.now();
            if (!this.userMessageCount[event.username]) {
                this.userMessageCount[event.username] = [];
            }
            this.userMessageCount[event.username] = this.userMessageCount[event.username].filter(time => currentTime - time < this.message_time_window);
            if (this.userMessageCount[event.username].length >= this.message_limit_per_user) {
                console.log(`User ${event.username} exceeded message limit.`);
                return;
            }
            this.userMessageCount[event.username].push(currentTime);
            if (this.chatMessages.length >= this.max_messages) {
                this.chatMessages.shift();
                console.log(`User ${event.username} exceeded max messages limit. shifting.`);
            }
            this.chatMessages.push(`${event.username}: ${event.message}`);
        });
    },

    async getResponse(messages = []) {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, stream: false, messages: messages });
    }
}
