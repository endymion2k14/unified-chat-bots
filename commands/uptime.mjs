import { equals } from '../utils.mjs';

export default {
    name: 'uptime',
    systems: ['botUptime', 'channelLive'],
    async reply(params, client, event) {
        if (params.length > 0) {
            if (equals(params[0].toLowerCase(), 'bot')) {
                const uptime = client.getSystem('botUptime');
                if ('getUptimeText' in uptime) { client.sendMessage(`Bot has been up for ${uptime.getUptimeText(false)}.`); }
                else { throw('Problem getting info from the required system.'); }
                return;
            }
        }
        const uptime = client.getSystem('channelLive');
        if ('getUptimeText' in uptime) {
            if (uptime._live) { client.sendMessage(`Stream has running for ${uptime.getUptimeText(false)}.`); }
            else { client.sendMessage('Stream is currently offline.'); }
        }
        else { throw('Problem getting info from the required system.'); }
    }
}