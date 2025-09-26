import { equals, log } from '../utils.mjs';

const dayMilliseconds = 24 * 60 * 60 * 1000;

export default {
    name: 'followers',
    followers: [],

    init(client) {
        this.channel = client._backend.channel;
        this.loadFollowerData(client).catch(err => log.error(err, `followers.mjs`));
        setInterval(_ => this.loadFollowerData(client).catch(err => log.error(err, `followers.mjs`)), dayMilliseconds);
    },

    getFollowerData(username) {
        if (this.followers.length > 0) {
            for (let i = 0; i < this.followers.length; i++) {
                if (equals(username.toLowerCase(), this.followers[i].name.toLowerCase())) {
                    return this.followers[i];
                }
            }
        }
        return 0;
    },

    async loadFollowerData(client) {
        const newData = await client.api.getAllFollowerData();
        this.followers.splice(0, this.followers.length); // Clear the array
        for (let i = 0; i < newData.length; i++) { this.followers.push(newData[i]); }
    }
}