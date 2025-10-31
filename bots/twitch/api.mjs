import https from 'https';
import { EventEmitter } from 'node:events';
import { log, sleep } from '../../utils.mjs';
import { EventTypes } from './irc.mjs';
import { TwitchEventSub } from './eventsub.mjs';

const SOURCE = 'TwitchAPI';
const USERS_PER_CHUNK = 100;

export class TwitchAPI extends EventEmitter {
    _data = {
        token: 0,
        userId: 0,
        roomId: 0,
        applicationId: 0,
        channel: 0,
        usertoken: "",
        refresh: "",
        tokenExpiry: 0,
    }

    constructor(token, channel, id, secret, usertoken, refresh, expiry = 0) {
        super();
        this._data.token = token;
        this._data.channel = channel;
        this._data.applicationId = id;
        this._data.secret = secret;
        this._data.usertoken = usertoken;
        this._data.refresh = refresh;
        this._data.tokenExpiry = expiry;
        this.eventsub = null;
    }

    isReady() { return !(this._data.token === 0 || this._data.roomId === 0 || this._data.channel === 0 || this._data.applicationId === 0); }

    // OAuth Tokens
    async refreshToken() {
        if (!this._data.refresh || !this._data.secret || !this._data.applicationId) { throw new Error('Missing refresh token, client secret, or client ID for refresh'); }
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this._data.applicationId,
                client_secret: this._data.secret,
                refresh_token: this._data.refresh,
                grant_type: 'refresh_token',
            }),
        });
        const data = await response.json();
        if (!response.ok) { throw new Error(`Token refresh failed: ${data.message}`); }
        if (data.refresh_token) { this._data.refresh = data.refresh_token; }
        if (data.expires_in) { this._data.tokenExpiry = Date.now() + (data.expires_in * 1000); }
        this.emit('token_refreshed', { usertoken: data.access_token, refresh: this._data.refresh, expiry: this._data.tokenExpiry });
    }

    startAutoRefresh() {
        if (!this._data.refresh) { log.info('No refresh token available, skipping auto-refresh', `${SOURCE}-${this._data.channel}`); return; }
        if (this._refreshTimeout) { clearTimeout(this._refreshTimeout); }
        this._scheduleNextRefresh();
        log.info('Token auto-refresh started', `${SOURCE}-${this._data.channel}`);
    }

    _scheduleNextRefresh() {
        const bufferMs = 5 * 60 * 1000;
        const timeUntilExpiry = this._data.tokenExpiry - Date.now() - bufferMs;
        const intervalMs = Math.max(1000, timeUntilExpiry);
        this._refreshTimeout = setTimeout(() => { this.refreshToken().then(() => this._scheduleNextRefresh()).catch(err => { log.error(`Auto-refresh failed: ${err.message}`, SOURCE); this._scheduleNextRefresh(); }); }, intervalMs);
    }

    // EventSubs
    startEventSub() {
        if (!this._data.usertoken || !this._data.applicationId) { log.info('No usertoken available, skipping EventSub', `${SOURCE}-${this._data.channel}`); return; }
        this.eventsub = new TwitchEventSub(this._data.usertoken, this._data.applicationId, this._data.channel);
        this.eventsub.on('ready', () => { this.subscribeToEvents(); });
        this.eventsub.on('channel.follow', (event) => this.emit('follow', event));
        log.info('EventSub started', `${SOURCE}-${this._data.channel}`);
    }

    async subscribeToEvents() {
        if (!this.eventsub || !this.isReady()) return;
        try {
            // Requires: channel:read:follows
            // Example of subscription. 'something', version, condition
            await this.eventsub.subscribe('channel.follow', 2, { broadcaster_user_id: this._data.roomId.toString(), moderator_user_id: this._data.userId.toString() });
        } catch (err) {
            log.error(`Failed to subscribe to EventSub events: ${err.message}`, SOURCE);
        }
    }

    // Token is expected to have: moderator:manage:chat_messages
    // https://dev.twitch.tv/docs/api/reference#delete-chat-messages
    async clearChat() {
        const options = {
            hostname: 'api.twitch.tv',
            method: 'DELETE',
            path: `/helix/moderation/chat?broadcaster_id=${this._data.roomId}&moderator_id=${this._data.userId}`,
            headers: {
                'Client-ID': `${this._data.applicationId}`,
                'Authorization': `Bearer ${this._data.token}`
            }
        }
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => { resolve(data); });
            }).on('error', err => { log.error(err); reject(err); });
            req.end();
        });
    }
    // Token is expected to have: moderator:manage:chat_messages
    // https://dev.twitch.tv/docs/api/reference#delete-chat-messages
    async removeMessage(messageId) {
        const options = {
            hostname: 'api.twitch.tv',
            method: 'DELETE',
            path: `/helix/moderation/chat?broadcaster_id=${this._data.roomId}&moderator_id=${this._data.userId}&message_id=${messageId}`,
            headers: {
                'Client-ID': `${this._data.applicationId}`,
                'Authorization': `Bearer ${this._data.token}`
            }
        }
        return new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => { try { resolve(JSON.parse(data)); } catch (err) { reject(err); } });
            }).on('error', err => { log.error(err, `${SOURCE}-removeMessage-id:${messageId}`); reject(err); });
            req.end();
        });
    }

    async isChannelLive() {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${this._data.channel}`, {
            method: 'GET',
            headers: {
                'Client-ID': `${this._data.applicationId}`,
                'Authorization': `Bearer ${this._data.token}`
            }
        });
        if (!response.ok) { this.emit('error', `HTTP ${response.status}`); return false; }
        const json = await response.json();
        const isLive = json.data.length > 0;
        this.emit(isLive ? EventTypes.stream_start : EventTypes.stream_end, { channel: this._data.channel, live: isLive, started_at: isLive ? new Date(json.data[0].started_at).getTime() : 0 });
        return isLive;
    }

    async getAllFollowerData() {
        const followers = [];

        if (!this.isReady()) { log.error('Missing data for getAllFollowerData to request the needed data from twitch!', SOURCE); }
        else {
            log.info('Started loading follower data', `${SOURCE}-${this._data.channel}`);
            let pagination = '';
            let done = false;
            while (!done) {
                const options = {
                    hostname: 'api.twitch.tv',
                    path: `/helix/channels/followers?broadcaster_id=${this._data.roomId}&first=${USERS_PER_CHUNK}${pagination.length < 1 ? '' : `&after=${pagination}`}`,
                    headers: {
                        Authorization: `Bearer ${this._data.token}`,
                        'Client-ID': this._data.applicationId
                    }
                }

                let parseData = '';
                https.get(options, r => {
                    r.setEncoding('utf8');
                    r.on('data', data => { parseData += data; });
                    r.on('end', _ => {
                        const json = JSON.parse(parseData);
                        if (json === undefined) { log.warn('Failed to parse follower data:', SOURCE); log.data(parseData, SOURCE); done = true; return; }
                        if (json.status) { if (json.status === 401) { log.error('Token expired!'); done = true; return; } }
                        if (!('cursor' in json.pagination)) { done = true; }
                        const next = `${json.pagination.cursor}`.toString();
                        if (!done) { pagination = next; }
                        for (let i = 0; i < json.data.length; i++) {
                            followers.push({
                                id: json.data[i].user_id,
                                name: `${json.data[i].user_name}`,
                                time: new Date(json.data[i].followed_at)
                            });
                        }
                    });
                });
                if (!done) { await sleep(3); } // throttle requests to make sure we dont hit requests per minute limits
            }
        }

        log.info('Finished loading follower data', `${SOURCE}-${this._data.channel}`);
        return followers;
    }

    async getFollowerData() {
        const result = {};

        if (!this.isReady()) { log.error('Missing data for getFollowerData to request the needed data from twitch!', SOURCE); }
        else {
            // TODO
        }

        return result;
    }
}
