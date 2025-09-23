const systemName = 'botUptime';

export default {
    name: 'uptime',
    system: [systemName],
    async reply(params, client, event) {
        const uptime = client.getSystem(systemName);
        if ('getUptimeText' in uptime) { client.sendMessage(`Bot has been up for ${uptime.getUptimeText(false)}`); }
        else { throw('Problem getting info from the required system'); }
    }
};