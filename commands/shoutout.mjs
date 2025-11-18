export default {
    name: 'shoutout',
    aliases: ['so'],
    async reply(params, client, event) {
        if (params.length < 1) { client.sendMessage(`You need to specify the Streamer for which you want a shoutout.`); return; }
        let username = params[0];
        if (username && username.startsWith('@')) { username = username.slice(1); }
        try {
            const userInfo = await client.api.getAccountInfo(username);
            if (!userInfo) { client.sendMessage('The Streamer does not exist or there was an error getting the required information.'); return; }
            const broadcasterId = userInfo.id;
            const streamInfo = await client.api.getStreamInfo(broadcasterId);
            let lastPlayedGame = 'they are not currently streaming';
            if (streamInfo) {
                lastPlayedGame = streamInfo.game_name;
                client.sendMessage(`BIG SHOUTOUT TO @${username}, they are currently streaming in the ${lastPlayedGame} category @ https://www.twitch.tv/${username}`);
                // sendAnnouncement requires OAuth so is disabled in favor of 60 day token.
                //client.api.sendAnnouncement(broadcasterId, `BIG SHOUTOUT TO @${username}, they are currently streaming in the ${lastPlayedGame} category @ https://www.twitch.tv/${username}`);
            } else {
                client.sendMessage(`BIG SHOUTOUT TO @${username}, ${lastPlayedGame} @ https://www.twitch.tv/${username}`);
                // sendAnnouncement requires OAuth so is disabled in favor of 60 day token.
                //client.api.sendAnnouncement(broadcasterId, `BIG SHOUTOUT TO @${username}, ${lastPlayedGame} @ https://www.twitch.tv/${username}`);
            }
        } catch (error) { client.sendMessage(`Error checking user: ${error}`); }
    },
};
