import { EventTypes } from '../bots/twitch/irc.mjs';
import { getTimeDifference } from '../utils.mjs';

export default {
    name: 'channelLive',
    _live: false,
    _startTime: 0,
    init(client) {
        client.api.addListener(EventTypes.stream_start, status => { this._live = true ; this._startTime = new Date().getTime(); });
        client.api.addListener(EventTypes.stream_end  , status => { this._live = false; this._startTime = 0; });
        setInterval(_ => { client.api.isChannelLive(); }, 60 * 1000 );
    },
    _now() { return new Date().getTime(); },
    getUptimeValue() { return this._startTime - this._now(); },
    getUptimeText(shortened_words = true) { return getTimeDifference(this.getUptimeValue(), 0, shortened_words); }
}