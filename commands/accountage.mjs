import { equals, getTimeDifference, log } from '../utils.mjs';
const SOURCE = 'accountage.mjs';

export default {
    name: 'accountage',
    aliases: ['aa'],
    async reply(params, client, event) {
        const username = (params.length < 1 || params[0].length < 1) ? event.username : params[0];
        const accountAge = await client.api.getAccountAge(username);
        if (accountAge < 0) { client.sendMessage('Username does not exist or there was an error getting the required information.'); return; }
        client.sendMessage(`${(params.length < 1 || params[0].length < 1) ? `${username}, your account was created ` : `${username} created their account `} ${getTimeDifference(new Date().getTime(), new Date(accountAge.created_at).getTime(), false, false)} ago.`);
    },
};
