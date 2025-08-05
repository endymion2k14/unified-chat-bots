import { log } from '../../utils.mjs';

const SOURCE_NAME = 'Twitch';

export const EventTypes = {
    connect: 'connect',
    disconnect: 'disconnect',
    message: 'message',
    ban: 'ban',
    raid: 'raid',
}

export function connect(settingsJSON) {
    const Client = {
        // Public

        settings: settingsJSON,
        on: function(eventType = '', callback = null) { Client._addEventListener(eventType, callback).catch(err => { log.error(err, SOURCE_NAME); }); },
        connect: function() {
            let valid = true;
            // Check if settings seem valid
            try {
                // Check if settings are passed
                if (!settingsJSON) {
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
        },

        // Private

        _active: false,
        _initialized: false,
        _eventListeners: [],
        _addEventListener: async function(type, callback) {
            if (!callback) {throw('No callback specified'); }
            if (!type) { throw('No EventType specified'); }
            if (!(type in EventTypes)) { throw('Invalid EventType specified'); }

            // TODO
        },
    };
    return Client;
}