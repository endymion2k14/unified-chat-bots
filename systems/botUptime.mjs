import { getTimeDifference, log } from "../utils.mjs";

export default {
    name: 'botUptime',
    startTime: 0,
    init(client) {
        log.info('upTime system is being initialized...', 'upTime');
        this.start = this._now();
    },
    _now() { return new Date().getTime(); },
    getUptimeValue() { return this.start - this._now(); },
    getUptimeText(shortened_words = true) { return getTimeDifference(this.getUptimeValue(), 0, shortened_words); }
}