import { EventTypes } from '../bots/twitch/irc.mjs';
import { getFullTimestamp, getTimeDifference, log } from '../utils.mjs';

export default {
    name: 'channelLive',
    data: {},
    init(client) {
        client.api.addListener(EventTypes.stream_start, status => {
            // Make sure data is stored
            if (!(client.channel in this.data)) { this.data[client.channel] = { live: false, startTime: 0 }; }

            // Check if message needs to be sent
            if (this.data[client.channel].live) { return; }

            // Update info
            log.info(`Channel '${client.channel}' started streaming at ${getFullTimestamp(new Date(status.started_at))}.`, 'live.mjs');
            this.data[client.channel].live = true;
            this.data[client.channel].startTime = status.started_at;
        });
        client.api.addListener(EventTypes.stream_end  , status => {
            // Make sure data is stored
            if (!(client.channel in this.data)) { this.data[client.channel] = { live: false, startTime: 0 }; }

            // Check if message needs to be sent
            if (!this.data[client.channel].live) { return; }

            // Update info
            if (this.data[client.channel].live) { log.info(`Channel '${client.channel}' went offline.`, 'live.mjs'); }
            this.data[client.channel].live = false;
            this.data[client.channel].startTime = 0;
        });
        this.callAPI(client);
        setInterval(_ => { this.callAPI(client); }, 60 * 1000 );
    },
    _now() { return new Date().getTime(); },
    getUptimeValue(channel) {
        if (channel in this.data) { return this.data[channel].startTime; }
        return 0;
    },
    getUptimeText(channel, shortened_words = true) { return getTimeDifference(this.getUptimeValue(channel), this._now(), shortened_words); },
    callAPI(client) { client.api.isChannelLive().catch(e => {}); },
    isLive(channel) {
        return this.data[channel] && this.data[channel].live || false;
    }
}
