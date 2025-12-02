export default {
    name: 'obs',
    async reply(params, client, event) {
        if (event.privileges.super || event.privileges.broadcaster || event.privileges.moderator) {
            if (params.length === 0) { client.sendMessage('Usage: !obs scene <scene_name> [bot_index] | !obs source enable/disable <source_name> [scene_name] [duration_seconds] [bot_index] | !obs stats [bot_index] | !obs reconnect [bot_index] | !obs record start/stop [bot_index] | !obs stream start/stop [bot_index] | !obs audio mute/unmute <source_name> [bot_index]'); return; }
            const subcommand = params.shift().toLowerCase();
            if (!client.obsClients || client.obsClients.length === 0) { client.sendMessage('OBS not connected.'); return; }

            // Parse bot index and duration from the end
            let botIndex = 0;
            let duration = 0;
            if (subcommand === 'source') {
                if (params.length > 0 && !isNaN(params[params.length - 1])) {
                    duration = parseInt(params.pop());
                    if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                }
            } else if (subcommand === 'scene' && params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
            if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
            const obsClient = client.obsClients[botIndex];

            if (subcommand === 'scene') {
                if (params.length === 0) { client.sendMessage('Usage: !obs scene <scene_name> [bot_index]'); return; }
                const sceneName = params.join(' ');
                try {
                    await obsClient.changeScene(sceneName);
                    client.sendMessage(`Changed scene to: ${sceneName} on OBS bot ${botIndex}`);
                } catch (error) { client.sendMessage(`Failed to change scene: ${error.message}`); }
            } else if (subcommand === 'source') {
                if (params.length < 2) { client.sendMessage('Usage: !obs source enable/disable <source_name> [scene_name] [duration_seconds] [bot_index]'); return; }
                const action = params.shift().toLowerCase();
                const sourceName = params.shift();
                let sceneName = params.join(' ') || await obsClient.getCurrentScene();
                if (!sceneName) { client.sendMessage('Could not determine scene.'); return; }
                const enabled = action === 'enable';
                try {
                    await obsClient.setSourceEnabled(sceneName, sourceName, enabled, duration);
                    const durationMsg = duration > 0 ? ` for ${duration} seconds` : '';
                    client.sendMessage(`${enabled ? 'Enabled' : 'Disabled'} source '${sourceName}' in scene '${sceneName}'${durationMsg} on OBS bot ${botIndex}`);
                } catch (error) { client.sendMessage(`Failed to set source: ${error.message}`); }
            } else if (subcommand === 'stats') {
                // Parse bot index from the end
                let botIndex = 0;
                if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
                const obsClient = client.obsClients[botIndex];
                const stats = await obsClient.getStreamStats();
                if (!stats) { client.sendMessage('Could not retrieve OBS stats.'); return; }
                let msg = `OBS Stats (Bot ${botIndex}): Streaming: ${stats.outputActive ? 'Active' : 'Inactive'}`;
                if (stats.outputActive) {
                    const bitrate = stats.outputBytes ? Math.round((stats.outputBytes * 8) / (stats.outputDuration / 1000) / 1000) : 0;
                    const fps = stats.outputTotalFrames ? Math.round(stats.outputTotalFrames / (stats.outputDuration / 1000)) : 0;
                    const dropped = stats.outputSkippedFrames || 0;
                    msg += `, Bitrate: ${bitrate} kbps, FPS: ${fps}, Dropped Frames: ${dropped}`;
                }
                client.sendMessage(msg);
            } else if (subcommand === 'reconnect') {
                // Parse bot index from the end
                let botIndex = 0;
                if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
                const obsClient = client.obsClients[botIndex];
                obsClient.reconnect();
                client.sendMessage(`Attempting to reconnect to OBS on bot ${botIndex}`);
            } else if (subcommand === 'record') {
                if (params.length < 1) { client.sendMessage('Usage: !obs record start/stop [bot_index]'); return; }
                const action = params.shift().toLowerCase();
                let botIndex = 0;
                if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
                const obsClient = client.obsClients[botIndex];
                try {
                    if (action === 'start') {
                        await obsClient.startRecording();
                        client.sendMessage(`Started recording on OBS bot ${botIndex}`);
                    } else if (action === 'stop') {
                        await obsClient.stopRecording();
                        client.sendMessage(`Stopped recording on OBS bot ${botIndex}`);
                    } else { client.sendMessage('Invalid action. Use start or stop'); }
                } catch (error) { client.sendMessage(`Failed to control recording: ${error.message}`); }
            } else if (subcommand === 'stream') {
                if (params.length < 1) { client.sendMessage('Usage: !obs stream start/stop [bot_index]'); return; }
                const action = params.shift().toLowerCase();
                let botIndex = 0;
                if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
                const obsClient = client.obsClients[botIndex];
                try {
                    if (action === 'start') {
                        await obsClient.startStreaming();
                        client.sendMessage(`Started streaming on OBS bot ${botIndex}`);
                    } else if (action === 'stop') {
                        await obsClient.stopStreaming();
                        client.sendMessage(`Stopped streaming on OBS bot ${botIndex}`);
                    } else { client.sendMessage('Invalid action. Use start or stop'); }
                } catch (error) { client.sendMessage(`Failed to control streaming: ${error.message}`); }
            } else if (subcommand === 'audio') {
                if (params.length < 2) { client.sendMessage('Usage: !obs audio mute/unmute <source_name> [bot_index]'); return; }
                const action = params.shift().toLowerCase();
                const sourceName = params.shift();
                let botIndex = 0;
                if (params.length > 0 && !isNaN(params[params.length - 1])) { botIndex = parseInt(params.pop()); }
                if (botIndex < 0 || botIndex >= client.obsClients.length) { client.sendMessage(`Invalid bot index. Available: 0-${client.obsClients.length - 1}`); return; }
                const obsClient = client.obsClients[botIndex];
                try {
                    const mute = action === 'mute';
                    await obsClient.setAudioMute(sourceName, mute);
                    client.sendMessage(`${mute ? 'Muted' : 'Unmuted'} audio for '${sourceName}' on OBS bot ${botIndex}`);
                } catch (error) { client.sendMessage(`Failed to control audio: ${error.message}`); }
            } else { client.sendMessage('Unknown subcommand. Use !obs scene, !obs source, !obs stats, !obs reconnect, !obs record, !obs stream, or !obs audio'); }
        } else { client.sendMessage(`You need to be at least a moderator to use this command ${event.username}.`); }
    }
}