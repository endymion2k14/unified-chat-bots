import { EventTypes } from '../bots/twitch/irc.mjs';
import { getFullTimestamp, getTimeDifference, log } from '../utils.mjs';

export default {
    name: 'channelLive',
    _live: false,
    _startTime: 0,
    init(client) {
        client.api.addListener(EventTypes.stream_start, status => {
            if (!this._live) { log.info(`Channel '${client.channel}' started streaming at ${getFullTimestamp(new Date(status.started_at))}.`, 'live.mjs'); }
            this._live = true;
            this._startTime = status.started_at;
        });
        client.api.addListener(EventTypes.stream_end  , status => {
            if (this._live) { log.info(`Channel '${client.channel}' went offline.`, 'live.mjs'); }
            this._live = false;
            this._startTime = 0;
        });
        this.callAPI(client);
        setInterval(_ => { this.callAPI(client); }, 60 * 1000 );
    },
    _now() { return new Date().getTime(); },
    getUptimeValue() { return this._startTime - this._now(); },
    getUptimeText(shortened_words = true) { return getTimeDifference(this.getUptimeValue(), 0, shortened_words); },
    callAPI(client) { client.api.isChannelLive().catch(e => {}); }
}