import { Ollama } from 'ollama';
import { EventTypes } from '../bots/twitch/irc.mjs';
import { log } from '../utils.mjs';

const SOURCE = 'gptrecap.mjs';

export default {
    name: 'gptrecap',
    data: {},
    ollama: 0,
    model: 'gemma3:4b-it-qat',
    max_messages: 0,
    message_limit_per_user: 0,
    message_time_window: 60000,
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
        this.data[client.channel] = this.data[client.channel] || { live: false, userMessages: {} };
        client.api.addListener(EventTypes.stream_start, status => { if (this.data[client.channel].live) { return; } this.data[client.channel].live = true; });
        client.api.addListener(EventTypes.stream_end, status => { if (!this.data[client.channel].live) { return; } this.data[client.channel].live = false; this.data[client.channel].userMessages = {}; log.info(`Clearing GPTRecap information for channel ${client.channel}`, SOURCE); });
        client.on('message', (event) => {
            if (this.data[client.channel].live) {
                this.data[client.channel].userMessages[event.username] = this.data[client.channel].userMessages[event.username] || [];
                // Filter by time window
                if (this.message_time_window > 0) {
                    const cutoff = Date.now() - this.message_time_window;
                    this.data[client.channel].userMessages[event.username] = this.data[client.channel].userMessages[event.username].filter(msg => msg.timestamp >= cutoff);
                }
                // Enforce per-user limit
                if (this.message_limit_per_user > 0 && this.data[client.channel].userMessages[event.username].length >= this.message_limit_per_user) {
                    this.data[client.channel].userMessages[event.username].shift();
                }
                // Enforce global max_messages
                if (this.max_messages > 0) {
                    let totalMessages = Object.values(this.data[client.channel].userMessages).reduce((sum, msgs) => sum + msgs.length, 0);
                    while (totalMessages >= this.max_messages) {
                        let oldestUser = null;
                        let oldestTime = Date.now();
                        for (const [user, msgs] of Object.entries(this.data[client.channel].userMessages)) { if (msgs.length > 0 && msgs[0].timestamp < oldestTime) { oldestTime = msgs[0].timestamp; oldestUser = user; } }
                        if (oldestUser) { this.data[client.channel].userMessages[oldestUser].shift(); totalMessages--; } else { break; }
                    }
                }
                this.data[client.channel].userMessages[event.username].push({ message: event.message, timestamp: Date.now() });
            }
        });
    },

    removeUser(channel, username) { if (this.data[channel].userMessages[username]) { delete this.data[channel].userMessages[username]; return true; } return false; },

    async getResponse(messages = []) {
        if (!this.ollama) { throw('Unable to contact GPT without its info being initialized.'); }
        return await this.ollama.chat({ model: this.model, stream: false, messages: messages });
    }
}
