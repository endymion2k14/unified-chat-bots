import { log } from '../../utils.mjs'
import { EventEmitter } from 'node:events';

const SOURCE = "Twitch-IRC";

// Socket settings
const host = 'irc-ws.chat.twitch.tv';
const port = 443;
const url = `wss://${host}:${port}`;

// Reconnect settings
const maxReconnectDelay = 60 * 1000; // 1 minute

export class TwitchIRC extends EventEmitter {
    constructor({ username, oauth, channel }) {
        super();

        this.username   = username.toLowerCase();
        this.oauth      = oauth;
        this.channel    = channel.replace(/^#/, '');  // strip leading # - incase we do #username

        // Socket
        this.reconnectAttempts  = 0;
        this.ws                 = null;

        // Rate-limit
        this.messageQueue       = [];
        this.periodStart        = Date.now();
        this.messagesInPeriod   = 0;

        this.connect();
    }

    connect() {
        const url = `wss://${this.host}:${this.port}`;
        this.ws = new WebSocket(url);

        this.ws.addEventListener('open', () => {
            log.info('Connected to Twitch IRC', SOURCE);
            this.ws.send(`CAP REQ :twitch.tv/tags`); // this.ws.send(`CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands`);
            this.ws.send(`PASS ${this.oauth}`);
            this.ws.send(`NICK ${this.username}`);
            this.ws.send(`USER ${this.username} 8 * :${this.username}`);
            this.ws.send(`JOIN #${this.channel}`);
            this.reconnectAttempts = 0;
        });

        this.ws.addEventListener('message', (event) => this.parse(event.data.toString()));
        this.ws.addEventListener('error',   (error) => this.handleError(error));
        this.ws.addEventListener('close',   (code, reason) => this.handleClose(code, reason));
    }

    /* ---------- sending ---------- */
    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(`${message}\r\n`);
    }
    say(message) {
        this.messageQueue.push(message);
        this.flushQueue();
    }

    flushQueue() {
        const now = Date.now();
        if (now - this.periodStart >= 30000) {
            this.periodStart = now;
            this.messagesInPeriod = 0;
        }
        if (this.messagesInPeriod >= 20) return;    // hit limit

        const next = this.messageQueue.shift();
        if (!next) return;

        log.info(`[${this.username}] ${next}`, SOURCE);
        this.send(`PRIVMSG #${this.channel} :${next}`);
        this.messagesInPeriod++;

        // Schedule next flush
        setTimeout(() => this.flushQueue(), 1500);
    }

    parse(chunk) {
        const lines = chunk.split('\r\n').filter(Boolean);
        for (const line of lines) this.parseSingle(line);
    }
    parseSingle(line) {
        // PING/PONG keep‑alive
        if (line.startsWith('PING')) {
            this.send(`PONG ${line.split(' ')[1]}`);
            return;
        }

        // Example: @tags :nick!ident@host PRIVMSG #channel :message
        const m = line.match(/^(@[^ ]+ )?:(\S+?)!(\S+?)@(\S+) PRIVMSG #(\S+) :(.*)$/);
        if (!m) return;
        const [_, tagsPart, nick, ident, host, chan, message] = m;
        const tags = this.parseTags(tagsPart);
        const privileges = this.getPrivileges(tags);
        this.emit('chat', { nick, ident, host, chan, message, tags, privileges });
    }

    parseTags(raw) {
        if (!raw) return {};
        const tags = {};
        const pairs = raw.slice(1).split(';');      // strip leading '@'
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            tags[key] = value || true;
        }
        return tags;
    }

    parseBadges(badgesTag) {
        if (!badgesTag) return {}; // badges/…: "broadcaster/1,subscriber/12,vip/1"

        const badges = {};
        for (const entry of badgesTag.split(',')) {
            const [name, version] = entry.split('/');
            badges[name] = version || null;
        }
        return badges;
    }

    getPrivileges(tags) {
        const badges = this.parseBadges(tags.badges || '');
        return {
            broadcaster:    tags['user-type']   === 'broadcaster' || !!badges.broadcaster,
            moderator:      tags['user-type']   === 'mod'
                         || tags['user-type']   === 'global_mod'
                         || tags['user-type']   === 'staff'
                         || tags.mod            === '1',
            vip:            !!badges.vip,
            subscriber:     !!badges.subscriber,
            turbo:          !!badges.turbo,
            bits:           !!badges.bits,
        };
    }

    handleError(err) { log.error(`WS error: ${err}`, SOURCE); }

    handleClose(code, reason) {
        log.warn(`WS closed (code=${code} reason=${reason}). Reconnecting...`, SOURCE);
        this.reconnect();
    }

    reconnect() {
        if (this.reconnectAttempts >= 10) {
            log.error('Too many reconnect attempts. Giving up.', SOURCE);
            return;
        }
        const delay = Math.min(1000 * 2 * this.reconnectAttempts, maxReconnectDelay);
        setTimeout(_ => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
}