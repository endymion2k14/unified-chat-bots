import { EventTypes } from '../bots/twitch/irc.mjs';
import { log, randomInt, clamp, sleep } from '../utils.mjs';

const SOURCE = 'automated-messages';

export default {
    name: 'automatedMessages',
    client: 0,
    messages: [],
    currentMessage: 0,
    messagesSinceLastAutomated: 0,
    hasTimePassedSinceLastAutomatedMessage: true,

    // Config variables
    enabled: false,
    minutesRequired: 5,
    messagesRequired: 10,
    randomOrder: false,

    init(client) {
        this.client = client;
        client.addListener(EventTypes.message, event => { this.handleMessage(); });

        // Set variables from config
        const settings = client.getSystemConfig(this.name);
        if ('enabled'                      in settings) { this.enabled          = settings.enabled; }
        if ('randomOrder'                  in settings) { this.randomOrder      = settings.randomOrder; }
        if ('minutesBetweenMessages'       in settings) { this.minutesRequired  = settings.minutesBetweenMessages; }
        if ('chatsNeededBeforeNextMessage' in settings) { this.messagesRequired = settings.chatsNeededBeforeNextMessage; }
        if ('messages'                     in settings) { this.messages         = settings.messages; }
        if (this.messages.length === 0) { this.enabled = false; log.warn('System config did not contain any automated messages, system will not start.', SOURCE); }

        if (this.enabled) { this.startMessages().catch(err => { log.error(err, SOURCE); }); }
    },

    handleMessage() { this.messagesSinceLastAutomated++; },

    async startMessages() {
        while (this.enabled) {
            await this._awaitRequirements();
            if (this.enabled) { // Make sure system is still enabled
                if (this.randomOrder) { this.currentMessage = randomInt(0, this.messages.length); }
                this.currentMessage = clamp(this.currentMessage, 0, this.messages.length);
                if (this.currentMessage === this.messages.length) { this.currentMessage = 0; }
                const message = this.messages[this.currentMessage];

                switch (message.type) {
                    case 'single':
                        if (message.messages.length > 0) { this.client.sendMessage(message.messages[0]); }
                        else { log.warn(`Message #${this.currentMessage} does not contain any messages.`, SOURCE); }
                        break;
                    case 'random':
                        if (message.messages.length > 0) { this.client.sendMessage(message.messages[randomInt(0, message.messages.length)]); }
                        else { log.warn(`Message #${this.currentMessage} does not contain any messages.`, SOURCE); }
                        break;
                    case 'ordered':
                        if (message.messages.length < 1) { log.warn(`Message #${this.currentMessage} does not contain any messages.`, SOURCE); break; }
                        for (let i = 0; i < message.messages.length; i++) {
                            await this._awaitRequirements();
                            this.hasTimePassedSinceLastAutomatedMessage = false;
                            this.messagesSinceLastAutomated = 0;
                            if (!this.enabled) { break; } // Make sure system is still enabled
                            this.client.sendMessage(message.messages[i]);
                            if (i < message.messages.length - 1) { await sleep(this.minutesRequired * 60).then(_ => { this.hasTimePassedSinceLastAutomatedMessage = true; }); }
                        }
                        break;
                    case 'list':
                        if (message.messages.length < 1) { log.warn(`Message #${this.currentMessage} does not contain any messages.`, SOURCE); break; }
                        for (let i = 0; i < message.messages.length; i++) {
                            if (!this.enabled) { break; } // Make sure system is still enabled
                            this.client.sendMessage(message.messages[i]);
                            if (i < message.messages.length - 1) { await sleep(5); }
                        }
                        break;
                    default:
                        log.warn(`Message type '${message.type}' from message #${this.currentMessage} not implemented.`);
                        break;
                }
                this.currentMessage++;
                this.messagesSinceLastAutomated = 0;
                this.hasTimePassedSinceLastAutomatedMessage = false;
                await sleep(this.minutesRequired * 60).then(_ => { this.hasTimePassedSinceLastAutomatedMessage = true; });
            }
        }
    },

    async _awaitRequirements() {
        while (this.messagesSinceLastAutomated < this.messagesRequired && this.hasTimePassedSinceLastAutomatedMessage) {
            await sleep(5);
        }
    }
}