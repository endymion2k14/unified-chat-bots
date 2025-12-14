import { log } from '../utils.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = 'Twitch-autoRecord';

class TwitchAPIClient {
    constructor(appToken, clientId) {
        this.appToken = appToken;
        this.clientId = clientId;
    }
    async isChannelLive(channel) {
        try {
            const response = await fetch( `https://api.twitch.tv/helix/streams?user_login=${channel}`, { headers: { 'Client-ID': this.clientId, 'Authorization': `Bearer ${this.appToken}`, 'Content-Type': 'application/json' } } );
            if (!response.ok) { throw new Error(`HTTP ${response.status}`); }
            const data = await response.json();
            return data.data.length > 0;
        }
        catch (error) { log.error(`Error checking channel ${channel}: ${error.message}`, SOURCE); return false; }
    }
}

function validateFilenameTemplate(template) {
    const requiredVars = ['%(channel)s', '%(date)s', '%(time)s', '%(ext)s'];
    const hasAllRequired = requiredVars.every(variable => template.includes(variable));
    if (!hasAllRequired) { throw new Error('Template must include channel, date, time, and ext variables'); }
    return true;
}

function generateFilename(template, channel) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return template .replace('%(channel)s', channel) .replace('%(date)s', date) .replace('%(time)s', time) .replace('%(ext)s', 'mp4');
}

class TwitchRecorder {
    constructor(config) {
        this.api = new TwitchAPIClient(config.appToken, config.clientId);
        this.channels = new Map();
        this.recording = new Set();
        this.pollInterval = config.pollInterval || 60000;
    }
    loadChannelConfigs() {
        try {
            const configSystem = JSON.parse(fs.readFileSync('./configs/systems.json', 'utf8'));
            const autoRecordConfig = configSystem.autoRecord || {};
            
            for (const [channel, config] of Object.entries(autoRecordConfig)) {
                if (config.enabled) {
                    validateFilenameTemplate(config.template || '%(channel)s - %(date)s %(time)s.%(ext)s');
                    this.channels.set(channel, { quality: config.quality || 'best', template: config.template || '%(channel)s - %(date)s %(time)s.%(ext)s' });
                }
            }
        }
        catch (error) { log.error(`Failed to load channel configurations: ${error.message}`, SOURCE); }
    }
    async start() {
        if (!fs.existsSync('recordings')) { fs.mkdirSync('recordings', { recursive: true }); }
        this.loadChannelConfigs();
        if (this.channels.size === 0) { log.info('No channels configured for auto recording', SOURCE); return; }
        this.poll();
        setInterval(() => this.poll(), this.pollInterval);
        log.info(`Auto recording started for ${this.channels.size} channels: ${Array.from(this.channels.keys()).join(', ')}`, SOURCE);
    }
    async poll() {
        for (const [channel, config] of this.channels) {
            try { const isLive = await this.api.isChannelLive(channel); if (isLive && !this.recording.has(channel)) { this.startRecording(channel, config); } else if (!isLive && this.recording.has(channel)) { this.stopRecording(channel); } }
            catch (error) { log.error(`Error polling channel ${channel}: ${error.message}`, SOURCE); }
        }
    }
    startRecording(channel, config) {
        try {
            const filename = generateFilename(config.template, channel);
            const outputPath = path.join('recordings', filename);
            const args = [ '--quiet', '--output', outputPath, '--ffmpeg-video-transcode', 'copy', '--ffmpeg-audio-transcode', 'copy', `https://twitch.tv/${channel}`, config.quality ];
            const proc = spawn('streamlink', args, { stdio: ['inherit', 'inherit', 'pipe'] });
            proc.stderr.on('data', (data) => { log.info(`Streamlink: ${data.toString().trim()}`, SOURCE); });
            proc.on('spawn', () => { this.recording.add(channel); log.info(`Recording started: ${outputPath}`, SOURCE); });
            proc.on('close', (code) => { this.recording.delete(channel); log.info(`Recording ended with code ${code}: ${outputPath}`, SOURCE); });
            proc.on('error', (err) => { this.recording.delete(channel); log.error(`Recording error for ${channel}: ${err.message}`, SOURCE); });
        }
        catch (error) { log.error(`Failed to start recording for ${channel}: ${error.message}`, SOURCE); }
    }
    stopRecording(channel) {
        if (this.recording.has(channel)) { log.info(`Stopping recording for ${channel}`, SOURCE); this.recording.delete(channel); }
    }
}

export default {
    name: 'autoRecord',
    init(recorderConfig) {
        if (recorderConfig && typeof recorderConfig === 'object' && recorderConfig._settings) { log.info('autoRecord system detected bot-based initialization - skipping (use standalone mode with recorder config)', SOURCE); return; }
        const required = ['appToken', 'clientId'];
        const missing = required.filter(field => !recorderConfig[field]);
        if (missing.length > 0) { throw new Error(`Missing required fields: ${missing.join(', ')}`); }
        const recorder = new TwitchRecorder(recorderConfig);
        recorder.start().catch(err => { log.error(`Failed to start auto recording: ${err.message}`, SOURCE); });
    }
};
