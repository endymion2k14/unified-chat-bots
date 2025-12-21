import { equals, getTimeDifference } from '../utils.mjs';

export default {
    name: 'followage',
    aliases: ['fa', 'followtime', 'followed'],
    systems: ['followers'],
    async reply(params, client, event) {
        const system = client.getSystem('followers');
        if ('getFollowerData' in system) {
            if (params.length < 1) {
                if (event.privileges.broadcaster) { client.sendMessage(`Unable to obtain your follow-age, streamers are unable to follow themselves`); return; }
                const followerData = system.getFollowerData(event.username);
                if (followerData === 0) { client.sendMessage(`You can only get info from this command if you have been following for a certain time ${event.username}.`); }
                else { client.sendMessage(`You (${event.username}) have been a follower for ${getTimeDifference(new Date().getTime(), followerData.time, false, false)}.`); }
            } else {
                if (!event.privileges.moderator && !event.privileges.broadcaster && !event.privileges.super) { client.sendMessage('You need to be a moderator or higher to use this command!'); return; }
                if (equals(client.channel.toLowerCase(), params[0].toLowerCase())) { client.sendMessage(`Unable to obtain the streamers follow-age, as streamers are unable to follow themselves`); return; }
                const followerData = system.getFollowerData(params[0]);
                if (followerData === 0) { client.sendMessage(`${params[0]} could not be found in the currently loaded list of followers...`); }
                else { client.sendMessage(`${followerData.name} has been a follower for ${getTimeDifference(new Date().getTime(), followerData.time, false, false)}.`); }
            }
        }
        else { throw('Problem getting info from the required system'); }
    }
}
