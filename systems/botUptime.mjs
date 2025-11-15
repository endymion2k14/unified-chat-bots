import { getTimeDifference } from '../utils.mjs';

export default {
    name: 'botUptime',
    startTime: 0,
    init(client) { this.start = this._now(); },
    _now() { return new Date().getTime(); },
    getUptimeValue() { return this.start - this._now(); },
    getUptimeText(shortened_words = true) { return getTimeDifference(this.getUptimeValue(), 0, shortened_words); }
}