import { log } from '../../utils.mjs';
import { EventEmitter } from "node:events";

const SOURCE_NAME = 'Twitch';

export const EventTypes = {
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message',
    ban: 'ban',
    raid: 'raid',
}

export class Client extends EventEmitter {
    constructor(settingsJSON) {
        super();

        this._settings = settingsJSON;
        this._active = false;
        this._initialized = false;

        this.connect = function() {
            let valid = true;
            // Check if settings seem valid
            try {
                // Check if settings are passed
                if (!this._settings) {
                    valid = false;
                    throw('No config specified');
                }

                // Check if settings have the right parameters with data
                const missingSettings = [];
                // TODO: check the existence of important settings such as client-token, app-id and others if needed

                if (missingSettings.length > 0) {
                    valid = false;
                    throw(`Missing config info: ${missingSettings}`);
                }
            } catch (err) { log.error(err, SOURCE_NAME); }
            if (!valid) {

            } else {
                // TODO: start the client
            }
        }
    }
}