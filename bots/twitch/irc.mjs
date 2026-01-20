import { equals, log } from '../../utils.mjs'
import { EventEmitter } from 'node:events';

import { WebSocket } from 'ws';

const SOURCE = 'Twitch-IRC';

// Socket settings
const host = 'irc-ws.chat.twitch.tv';
const port = 443;
const url = `wss://${host}:${port}`;

// Reconnect settings
const maxReconnectDelay = 60 * 1000; // 1 minute

// Emit event types
export const EventTypes = {
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message',
    ban: 'ban',
    command: 'command',
    stream_start: 'stream.start',
    stream_end: 'stream.end',

    // IRC info
    _roomstate: 'roomState',
    _botuserstate: 'botUserState',
    _userstate: 'userState'
}

export class TwitchIRC extends EventEmitter {
    constructor({ username, oauth, channel, chat_show }) {
        super();

        this.username   = username.toLowerCase();
        // Token is expected to have: channel:moderate, chat:edit, chat:read, moderator:read:followers
        this.oauth      = `oauth:${oauth}`;
        this.channel    = channel.replace(/^#/, ''); // strip leading # - incase we do #username
        this.chat_show  = chat_show;

        // Socket
        this.reconnectAttempts  = 0;
        this.ws                 = null;
        this.isShuttingDown     = false;

        // Rate-limit
        this.messageQueue       = [];
        this.periodStart        = Date.now();
        this.messagesInPeriod   = 0;

        this.connect();
    }

    connect() {
        this.ws = new WebSocket(url);

        this.ws.addEventListener('open', () => {
            log.info('Connected to Twitch IRC', `${SOURCE}-${this.channel}`);
            this.ws.send(`CAP REQ :twitch.tv/tags twitch.tv/commands`); // this.ws.send(`CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands`);
            this.ws.send(`PASS ${this.oauth}`);
            this.ws.send(`NICK ${this.username}`);
            this.ws.send(`JOIN #${this.channel}`);
            this.reconnectAttempts = 0;
            this.emit(EventTypes.connect, { message: 'successfully connected!' });
        });

        this.ws.addEventListener('message', (event) => this.parse(event.data.toString()));
        this.ws.addEventListener('error', (event) => this.handleError(event.error));
        this.ws.addEventListener('close', (event) => this.handleClose(event.code, event.reason));
    }

    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) { log.error(`Cannot send message - WebSocket not open (readyState: ${this.ws.readyState})`, `${SOURCE}-${this.channel}`); return false; }
        try { this.ws.send(`${message}\r\n`); return true; }
        catch (error) { log.error(`Failed to send message to WebSocket: ${error}`, `${SOURCE}-${this.channel}`); return false; }
    }

    async say(message) {
        if (!message || !message.toString().trim().length) { log.warn('Message could not be sent, no message was passed or it was only whitespace', SOURCE); return; }
        let msgs = message.toString().trim().split('\n');
        let filteredMsgs = msgs.map(m => m.trim()).filter(m => m.length > 0);
        let allParts = [];
        for (let msg of filteredMsgs) {
            while (msg.length >= 350) {
                let space = 349;
                for (let i = space; i > 0; i--) { if (msg[i] === ' ') { space = i; break; } }
                allParts.push(msg.substring(0, space)); msg = msg.substring(space);
            }
            allParts.push(msg);
        }
        
        if (allParts.length > 1) { for (let i = 0; i < allParts.length; i++) { const queuedMessage = `[${i + 1}/${allParts.length}] ${allParts[i]}`; this.messageQueue.push(queuedMessage); } }
        else { for (let part of allParts) { this.messageQueue.push(part); } }
        this.flushQueue();
    }

    flushQueue() {
        const now = Date.now();
        if (now - this.periodStart >= 30000) { this.periodStart = now; this.messagesInPeriod = 0; }
        if (this.messagesInPeriod >= 20) { setTimeout(() => this.flushQueue(), 5000); return; }
        let next = this.messageQueue.shift();
        while (next && next.length === 0 && this.messageQueue.length > 0) { next = this.messageQueue.shift(); }
        if (!next) { return; }
        if (this.chat_show) { log.info(`${this.username}: ${next}`, `${SOURCE}-${this.channel}`); }
        const sendSuccess = this.send(`PRIVMSG #${this.channel} :${next}`);
        if (sendSuccess) { this.messagesInPeriod++; }
        else { this.messageQueue.unshift(next); setTimeout(() => this.flushQueue(), 5000); return; }
        if (this.messageQueue.length > 0) {
            const progressiveDelays = [1000, 1200, 1500, 1200, 1000];
            const delayIndex = Math.min(this.messageQueue.length, progressiveDelays.length - 1);
            const totalDelay = progressiveDelays[delayIndex];
            setTimeout(() => this.flushQueue(), totalDelay);
        }
    }

    parse(chunk) {
        const lines = chunk.split('\r\n').filter(Boolean);
        for (const line of lines) { this.parseSingle(line); }
    }

    parseSingle(line) {
        // Stop 2nd Parameter, Integer flood.
        const parts = line.split(' '); if (parts.length >= 3) { if (!isNaN(parts[1]) && Number.isInteger(Number(parts[1])) && 0 <= Number(parts[1]) <= 999) { return; } }
        // CAP
        if (line.includes('CAP')) { return; }
        // CLEARCHAT - Sent when a moderator removes all messages for a user (ban/timeout)
        const clearChat = line.match(/^(@[^ ]+ )?:tmi\.twitch\.tv CLEARCHAT #(\S+) :(.*)$/);
        if (clearChat) {
            const [_, tagsPart, chan, username] = clearChat;
            const tags = this.parseTags(tagsPart);
            const isTimeout = 'ban-duration' in tags;
            const duration = isTimeout ? `${tags['ban-duration']}s` : 'permanent';
            const msgId = isTimeout ? 'timeout_success' : 'ban_success';
            this.emit(EventTypes.ban, { 
                username: username, 
                message: `${username} was ${isTimeout ? `timed out for ${duration}` : 'banned'}.`,
                tags: { ...tags, 'msg-id': msgId } 
            });
            return;
        }
        // GLOBALUSERSTATE
        const globalUserState = line.match(/@.*display-name=(\w+);.*user-id=(\d+).*? :.* GLOBALUSERSTATE.*/);
        if (globalUserState) {
            const [_, displayname, userIdText] = globalUserState;
            if (!equals(this.username, displayname.toLowerCase())) { return; } // Make sure the data is from the bot user
            const userIdInt = parseInt(userIdText);
            if (!isNaN(userIdInt)) { this.emit(EventTypes._botuserstate, { userId: userIdInt }); }
            return;
        }
        // JOIN
        if (line.includes('JOIN')) { log.info(`Joined #${this.channel}`, `${SOURCE}-${this.channel}`); return; }
        // NOTICE
        const notice = line.match(/^(@[^ ]+ )?:tmi\.twitch\.tv NOTICE #(\S+) :(.*)$/);
        if (notice) {
            const [_, tagsPart, chan, message] = notice;
            const tags = this.parseTags(tagsPart);
            const msgId = tags['msg-id'];
            log.info(`NOTICE: ${message} (msg-id: ${msgId})`, `${SOURCE}-${this.channel}`);
            return;
        }
        // PING/PONG keep‑alive
        if (line.startsWith('PING')) { this.send(`PONG ${line.split(' ')[1]}`); return; }
        // PRIVMSG
        // Example: @tags :nick!ident@host PRIVMSG #channel :message
        const privmsg = line.match(/^(@[^ ]+ )?:(\S+?)!(\S+?)@(\S+) PRIVMSG #(\S+) :(.*)$/);
        if (privmsg) {
            const [_, tagsPart, ident, nickname, host, chan, message] = privmsg;
            const tags = this.parseTags(tagsPart);
            const privileges = this.getPrivileges(tags);
            this.emit(EventTypes.message, { username: nickname, identity: ident, host: host, channel: chan, message: message, tags: tags, privileges: privileges });
            return;
        }
        // USERNOTICE
        const usernotice = line.match(/^(@[^ ]+ )?:tmi\.twitch\.tv USERNOTICE #(\S+) :(.*)$/);
        if (usernotice) {
            const [_, tagsPart, chan, message] = usernotice;
            const tags = this.parseTags(tagsPart);
            const msgId = tags['msg-id'];
            const username = tags['msg-param-displayName'] || tags['msg-param-login'] || 'unknown';
            log.info(`USERNOTICE received: msg-id=${msgId}, username=${username}, channel=${chan}`, `${SOURCE}-${this.channel}`);
            return;
        }
        // RECONNECT
        if (line.includes('RECONNECT')) { log.info('Twitch IRC reconnect requested', `${SOURCE}-${this.channel}`); this.ws.close(); return; }
        // ROOMSTATE
        const roomstate = line.match(/@.*room-id=(\d+).*? :.* ROOMSTATE #.*/);
        if (roomstate) {
            const [_, roomidText] = roomstate;
            const roomidInt = parseInt(roomidText);
            if (!isNaN(roomidInt)) { this.emit(EventTypes._roomstate, { roomId: roomidInt }); }
            return;
        }
        // USERSTATE
        const userstate = line.match(/^@([^ ]+) :.* USERSTATE #(.+)$/);
        if (userstate) {
            const [_, tagsPart, chan] = userstate;
            const tags = this.parseTags(tagsPart);
            const badges = this.parseBadges(tags.badges || '');
            this.emit(EventTypes._userstate, { badges: badges, channel: chan });
            return;
        }

        //log.info(`Response not handled: ${line}`, `${SOURCE}-${this.channel}`);
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
        if (!badgesTag || badgesTag === true) return {}; // badges/…: "broadcaster/1,subscriber/12,vip/1"
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

    handleError(error) { log.error(`WS error: ${error}`, `${SOURCE}-${this.channel}`); }

    handleClose(code, reason) {
        if (this.isShuttingDown) { log.info(`WS closed during shutdown (code=${code} reason=${reason})`, `${SOURCE}-${this.channel}`); return; }
        log.warn(`WS closed (code=${code} reason=${reason}). Reconnecting...`, `${SOURCE}-${this.channel}`);
        this.reconnect();
    }

    disconnect() { this.isShuttingDown = true; if (this.ws && this.ws.readyState === WebSocket.OPEN) { this.ws.close(1000, 'Graceful shutdown'); } }

    reconnect() {
        if (this.isShuttingDown) { return; }
        if (this.reconnectAttempts >= 10) { this.emit(EventTypes.disconnect, { message: 'Max reconnect attempts reached! Disconnected.' }); return; }
        const delay = Math.min(1000 * 1 * this.reconnectAttempts, maxReconnectDelay);
        setTimeout(_ => { this.reconnectAttempts++; this.connect(); }, delay);
    }
}
