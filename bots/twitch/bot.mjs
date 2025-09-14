import { log } from '../../utils.mjs';
import { EventEmitter } from "node:events";
import { TwitchIRC, EventTypes } from "./irc.mjs";

const SOURCE_NAME = 'Twitch';

const neededSettings = [
    "secrets.token",
    "secrets.id",
    "settings.username",
    "settings.channel"
];

export class ClientTwitch extends EventEmitter {
    constructor(settingsJSON) {
        super();

        this._settings = settingsJSON;
        this._active = false;
        this._initialized = false;
        this._backend = null;

        this.connect = async function() {
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
                for (let i = 0; i < neededSettings.length; i++) {
                    let parts = neededSettings[i].split(".");
                    let inner = this._settings;
                    for (let j = 0; j < parts.length; j++) {
                        if (parts[j] in inner) { inner = inner[parts[j]]; }
                        else { missingSettings.push(neededSettings[i]); break; }
                    }
                }
                if (missingSettings.length > 0) {
                    valid = false;
                    throw(`Missing config info: ${missingSettings}`);
                }
            } catch (err) { log.error(err, SOURCE_NAME); }
            if (!valid) { log.warn('Couldn\'t start bot!', SOURCE_NAME); }
            else {
                this._backend = new TwitchIRC({ username: this._settings.settings.username, oauth: this._settings.secrets.token, channel: this._settings.settings.channel } );
                this._setupEvents();
                this._setupSystems();
                this._loadCommands();
            }
        };

        this._setupEvents = function() {
            this._backend.addListener(EventTypes.connect, event => {

            });
            this._backend.addListener(EventTypes.disconnect, event => {

            });
            this._backend.addListener(EventTypes.ban, event => {

            });
            this._backend.addListener(EventTypes.raid, event => {

            });
            this._backend.addListener(EventTypes.message, event => {

            });
        };
        this._setupSystems = function() {

        };
        this._loadCommands = function() {

        };
    }
}