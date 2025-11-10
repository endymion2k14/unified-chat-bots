import { equals } from '../utils.mjs';

export default {
    name: 'obs',
    aliases: ['scene', 'source'],
    async reply(params, client, event) {
        if (event.privileges.super || event.privileges.broadcaster || event.privileges.moderator) {
            if (params.length === 0) {
                client.sendMessage('Usage: !obs scene <scene_name> [bot_index] | !obs source enable/disable <source_name> [scene_name] [duration_seconds] [bot_index]');
                return;
            }
            const subcommand = params.shift().toLowerCase();
            if (!client.obsClients || client.obsClients.length === 0) {
                client.sendMessage('OBS not connected.');
                return;
            }

            // Parse bot index and duration from the end
            let botIndex = 0;
            let duration = 0;
            if (subcommand === 'source') {
                if (params.length > 0 && !isNaN(params[params.length - 1])) {
                    botIndex = parseInt(params.pop());
                    if (params.length > 0 && !isNaN(params[params.length - 1])) {
                        duration = parseInt(params.pop());
                    }
                }
            } else if (subcommand === 'scene') {
                if (params.length > 0 && !isNaN(params[params.length - 1])) {
                    botIndex = parseInt(params.pop());
                }
            }
            if (botIndex < 0 || botIndex >= client.obsClients.length) {
                client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`);
                return;
            }
            const obsClient = client.obsClients[botIndex];

            if (subcommand === 'scene') {
                if (params.length === 0) {
                    client.sendMessage('Usage: !obs scene <scene_name> [bot_index]');
                    return;
                }
                const sceneName = params.join(' ');
                await obsClient.changeScene(sceneName);
                client.sendMessage(`Changed scene to: ${sceneName} on OBS bot ${botIndex}`);
            } else if (subcommand === 'source') {
                if (params.length < 2) {
                    client.sendMessage('Usage: !obs source enable/disable <source_name> [scene_name] [duration_seconds] [bot_index]');
                    return;
                }
                const action = params.shift().toLowerCase();
                const sourceName = params.shift();
                let sceneName = params.join(' ') || await obsClient.getCurrentScene();
                if (!sceneName) {
                    client.sendMessage('Could not determine scene.');
                    return;
                }
                const enabled = action === 'enable';
                await obsClient.setSourceEnabled(sceneName, sourceName, enabled, duration);
                const durationMsg = duration > 0 ? ` for ${duration} seconds` : '';
                client.sendMessage(`${enabled ? 'Enabled' : 'Disabled'} source '${sourceName}' in scene '${sceneName}'${durationMsg} on OBS bot ${botIndex}`);
            } else {
                client.sendMessage('Unknown subcommand. Use !obs scene or !obs source');
            }
        } else { client.sendMessage(`You need to be at least a moderator to use this command ${event.username}.`); }
    }
}
