import { log } from "../../utils.mjs";

const SOURCE = 'TwitchAPI';

export class TwitchAPI {
    _data = {
        token: 0,
        userId: 0,
        roomId: 0,
        applicationId: 0,
        channel: 0,
    }

    constructor(token, channel, id) {
        this._data.token = token;
        this._data.channel = channel;
        this._data.applicationId = id;
    }

    async getAllFollowerData() {
        const followers = [];

        if (this._data.token === 0 || this._data.roomId === 0 || this._data.channel === 0 || this._data.applicationId === 0) { log.error('Missing data for getAllFollowerData to request the needed data from twitch!', SOURCE); }
        else {
            // TODO
        }

        return followers;
    }

    async getFollowerData() {
        const result = {};

        if (this._data.token === 0 || this._data.roomId === 0 || this._data.channel === 0 || this._data.applicationId === 0) { log.error('Missing data for getAllFollowerData to request the needed data from twitch!', SOURCE); }
        else {
            // TODO
        }

        return result;
    }
}