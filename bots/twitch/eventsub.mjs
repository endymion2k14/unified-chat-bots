import { EventEmitter } from 'node:events';
import { WebSocket } from 'ws';
import { log } from '../../utils.mjs';

const SOURCE = 'Twitch-EventSub';

export class TwitchEventSub extends EventEmitter {
    constructor(usertoken, clientId, channel) {
        super();
        this.usertoken = usertoken;
        this.clientId = clientId;
        this.ws = null;
        this.sessionId = null;
        this.reconnectAttempts = 0;
        this.subscriptions = new Map();
        this.channel = channel;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
        this.ws.on('open', () => { log.info('Connected to Twitch EventSub', `${SOURCE}-${this.channel}`); this.reconnectAttempts = 0; });
        this.ws.on('message', (data) => { try { const message = JSON.parse(data.toString()); this.handleMessage(message); } catch (err) { log.error(`Failed to parse EventSub message: ${err}`, `${SOURCE}-${this.channel}`); } });
        this.ws.on('error', (error) => { log.error(`EventSub WS error: ${error}`, `${SOURCE}-${this.channel}`); });
        this.ws.on('close', (code, reason) => { log.warn(`EventSub WS closed (code=${code} reason=${reason}). Reconnecting...`, `${SOURCE}-${this.channel}`); this.sessionId = null; this.reconnect(); });
    }

    handleMessage(message) {
        switch (message.metadata.message_type) {
            case 'session_welcome':
                this.sessionId = message.payload.session.id;
                log.info(`EventSub session established`, `${SOURCE}-${this.channel}`);
                this.emit('ready', this.sessionId);
                break;
            case 'notification':
                this.handleNotification(message.payload);
                break;
            case 'session_keepalive':
                break;
            default:
                log.info(`Unhandled EventSub message type: ${message.metadata.message_type}`, `${SOURCE}-${this.channel}`);
        }
    }

    handleNotification(payload) {
        const event = payload.event;
        const type = payload.subscription.type;
        log.info(`EventSub notification: ${type}`, `${SOURCE}-${this.channel}`);
        this.emit(type, event);
    }

    reconnect() {
        if (this.reconnectAttempts >= 5) { log.error('Max EventSub reconnect attempts reached', `${SOURCE}-${this.channel}`); return; }
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        setTimeout(() => { this.reconnectAttempts++; this.connect(); }, delay);
    }

    async subscribe(type, version, condition) {
        if (!this.sessionId) { throw new Error('EventSub session not ready'); }
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.usertoken}`,
                'Client-Id': this.clientId,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                version: version,
                condition,
                transport: {
                    method: 'websocket',
                    session_id: this.sessionId
                }
            })
        });
        if (!response.ok) { const error = await response.text(); throw new Error(`EventSub subscription failed: ${response.status} ${error}`); }
        const data = await response.json();
        this.subscriptions.set(type, data.data[0].id);
        log.info(`Subscribed to ${type}`, `${SOURCE}-${this.channel}`);
        return data.data[0].id;
    }

    async unsubscribe(type) {
        const subId = this.subscriptions.get(type);
        if (!subId) return;
        const response = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.usertoken}`,
                'Client-Id': this.clientId
            }
        });
        if (response.ok) { this.subscriptions.delete(type); log.info(`Unsubscribed from ${type}`, `${SOURCE}-${this.channel}`); } else { log.error(`Failed to unsubscribe from ${type}`, `${SOURCE}-${this.channel}`); }
    }
}
