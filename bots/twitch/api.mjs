export class TwitchAPI {
    _data = {
        token: 0,
        userId: 0,
        roomid: 0,
        channel: 0,
    }

    constructor(token, channel) {
        this._data.token = token;
        this._data.channel = channel;
    }

    async getAllFollowerData() {
        const followers = [];

        // TODO

        return followers;
    }

    async getFollowerData() {
        const result = {};
        // TODO
        return result;
    }
}