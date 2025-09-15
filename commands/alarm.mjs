import { sleep } from '../utils.mjs';

export default {
    name: 'alarm',
    aliases: ['timer'],
    async reply(params, client, event) {
        if (!event.privileges.moderator && !event.privileges.broadcaster && !event.privileges.super) {
            client.sendMessage('You need to be a moderator or higher to use this command!');
            return;
        }
        if (params.length < 2) { client.sendMessage('Not enough arguments to run this command!'); return; }
        const name = params[0];
        const number = parseInt(params[1]);
        if (isNaN(number)) { client.sendMessage('Second argument is not a number!'); return; }
        const total = Math.max(number, 0.017); // Clamp the timer to anything above one second
        const hours = Math.floor(total / 60);
        const minutes = Math.floor(total - (hours * 60));
        const seconds = Math.floor((total - (hours * 60 + minutes)) * 60);
        let time = hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}`.toString() : '';
        if (minutes > 0) { time += `${time.length > 0 ? ' and ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`.toString(); }
        if (seconds > 0) { time += `${time.length > 0 ? ' and ' : ''}${seconds} second${seconds > 1 ? 's' : ''}`.toString(); }
        client.sendMessage(`Timer \'${name}\' started for ${time}.`);
        sleep(60 * total).then(_ => { client.sendMessage(`Timer \'${name}\' ended.`); });
    }
}