import { EventTypes } from '../bots/twitch/irc.mjs';
import { getFullTimestamp, log } from '../utils.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = 'Twitch-autoRecord';

export function validateTemplate(template) {
    const requiredVars = ['%(channel)s', '%(date)s', '%(time)s'];
    const hasAllRequired = requiredVars.every(variable => template.includes(variable));
    if (!hasAllRequired) { throw new Error('Template must include channel, date, and time variables'); }
    if (!template.includes('%(ext)s')) { throw new Error('Template must end with %(ext)s'); }
    if (template.includes('../') || template.includes('..\\')) { throw new Error('Template cannot contain path traversal'); }
    if (template.length > 100) { throw new Error('Template too complex - keep it under 100 characters'); }
    return true;
}

export function processFilenameTemplate(template, channel) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return template .replace('%(channel)s', channel) .replace('%(date)s', date) .replace('%(time)s', time) .replace('%(ext)s', 'mp4');
}

function startRecording(channel, config, outputPath) {
    return new Promise((resolve, reject) => {
        const args = ['streamlink'];
        args.push('--output', outputPath);
        args.push('--ffmpeg-video-transcode', 'copy'); args.push('--ffmpeg-audio-transcode', 'copy');
        args.push(`twitch.tv/${channel}`);
        if (config.quality && config.quality !== 'best') { args.push(config.quality); }
        else { args.push('best'); }
        const proc = spawn('streamlink', args, { stdio: 'inherit' });
        proc.on('spawn', () => { log.info(`streamlink process started for ${channel}`, SOURCE); resolve(proc); });
        proc.on('error', (err) => {
            if (err.message.includes('No streams found')) { log.error(`Channel ${channel} appears to be offline`, SOURCE); }
            else if (err.message.includes('unrecognized arguments')) { log.error(`Invalid configuration for ${channel}: ${err.message}`, SOURCE); }
            else if (err.message.includes('Unable to open URL')) { log.error(`Network connectivity issues for ${channel}`, SOURCE); }
            else { log.error(`Recording error for ${channel}: ${err.message}`, SOURCE); }
            reject(err);
        });
    });
}

export default {
    name: 'autoRecord',
    data: {},
    init(client) {
        if (!fs.existsSync('recordings')) { fs.mkdirSync('recordings', { recursive: true }); }
        const configSystem = JSON.parse(fs.readFileSync('./configs/systems.json', 'utf8'));
        const config = configSystem[this.name].[client._settings.name];
        if (!config || !config.enabled) { log.info(`Auto recording disabled for ${client.channel}`, SOURCE); return; }
        this.data[client.channel] = { ffmpeg: null, config };
        client.api.addListener(EventTypes.stream_start, async (status) => {
            if (this.data[client.channel].ffmpeg) { log.warn(`Recording already in progress for ${client.channel}`, SOURCE); return; }
            try {
                log.info(`Starting auto recording for ${client.channel}`, SOURCE);
                const defaultTemplate = '%(channel)s - %(date)s %(time)s.%(ext)s';
                const filenameTemplate = config.filenameTemplate || defaultTemplate;
                const outputPath = path.join('recordings', filenameTemplate);
                try { validateTemplate(filenameTemplate); }
                catch (error) { log.error(`Invalid filename template for ${client.channel}: ${error.message}`, SOURCE); return; }
                const processedPath = processFilenameTemplate(outputPath, client.channel);
                const proc = await startRecording(client.channel, config, processedPath);
                proc.on('close', (code) => {
                    if (code === 0) { log.info(`Recording ended successfully: ${processedPath}`, SOURCE); }
                    else { log.warn(`Recording ended with code ${code}: ${processedPath}`, SOURCE); }
                    this.data[client.channel].ffmpeg = null;
                });
                proc.on('error', (err) => { log.error(`Recording error for ${client.channel}: ${err.message}`, SOURCE); this.data[client.channel].ffmpeg = null; });
                this.data[client.channel].ffmpeg = proc;
                log.info(`Live recording started: ${processedPath}`, SOURCE);
            }
            catch (error) { log.error(`Failed to start recording for ${client.channel}: ${error.message}`, SOURCE); }
        });
        client.api.addListener(EventTypes.stream_end, () => { if (this.data[client.channel].ffmpeg) { log.info(`Stopping recording for ${client.channel}`, SOURCE); this.data[client.channel].ffmpeg.kill('SIGINT'); this.data[client.channel].ffmpeg = null; } });
    }
};
