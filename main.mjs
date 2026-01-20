import { log, json } from './utils.mjs';
import { ClientTwitch } from './bots/twitch/bot.mjs';
import { WebConsole } from './bots/webconsole/webconsole.mjs';

const SOURCE = 'MAIN';

const clientsDiscord = [];
const clientsTwitch = [];
let webConsole;
let readyPromises = [];

async function start() {
    log.info('Loading settings');
    const settings = json.load('configs/secrets.json');

    // Check which bots to run
    const botsTwitch  = [];
    const botsDiscord = [];
    for (let i = 0; i < settings.discord.length; i++) { if (settings.discord[i].enabled) { botsDiscord.push(i); } }
    for (let i = 0; i < settings.twitch .length; i++) { if (settings.twitch [i].enabled) { botsTwitch .push(i); } }
    if (botsDiscord.length > 0) {
        log.info(`Starting ${botsDiscord.length} discord bots`, SOURCE);
        for (let i = 0; i < botsDiscord.length; i++) {
            for (let i = 0; i < botsDiscord.length; i++) { clientsDiscord.push(0 /* TODO */); }
            for (let i = 0; i < clientsDiscord.length; i++) { /* TODO */ }
        }
    }
    if (botsTwitch .length > 0) {
        log.info(`Starting ${botsTwitch .length} twitch bots`, SOURCE);
        for (let i = 0; i < botsTwitch.length; i++) {
            const twitchConfig = settings.twitch[botsTwitch[i]];
            clientsTwitch.push(new ClientTwitch(twitchConfig));
        }
        clientsTwitch.forEach(client => readyPromises.push(new Promise(resolve => client.once('ready', resolve))));
        for (let i = 0; i < clientsTwitch.length; i++) { clientsTwitch[i].connect(); }
    }

    // Wait for all bots to be ready before starting webconsole
    if (readyPromises.length > 0) {
        log.info('Waiting for bots to be ready...', SOURCE);
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 30000));
        const readyPromise = Promise.all(readyPromises).then(() => 'ready');
        const result = await Promise.race([readyPromise, timeoutPromise]);
        if (result === 'ready') { log.info('All bots ready, starting webconsole', SOURCE); }
        else { log.warn('Bot readiness timeout, proceeding anyway', SOURCE); }
    }
    // Run the web console
    if ('console' in settings) {
            webConsole = new WebConsole(getTwitchClients, getDiscordClients, settings);
            webConsole.start().catch(err => log.error(`${err}`, SOURCE));
    }
}

function getTwitchClients() { return clientsTwitch; }
function getDiscordClients() { return clientsDiscord; }

async function gracefulShutdown() {
    log.info('Starting graceful shutdown...', SOURCE);
    const shutdownPromises = [];
    // Shutdown Twitch clients
    clientsTwitch.forEach(client => { if (client && typeof client.disconnect === 'function') { shutdownPromises.push( client.disconnect().catch(err => log.error(`Error disconnecting Twitch client: ${err}`, SOURCE)) ); } });
    // Shutdown Web Console
    if (webConsole && typeof webConsole.stop === 'function') { shutdownPromises.push( webConsole.stop().catch(err => log.error(`Error stopping web console: ${err}`, SOURCE)) ); }
    // Wait for all shutdown operations to complete, with timeout
    const shutdownTimeout = 10000; // 10 seconds
    await Promise.race([ Promise.all(shutdownPromises), new Promise(resolve => setTimeout(resolve, shutdownTimeout)) ]);
    log.info('Graceful shutdown complete', SOURCE);
    process.exit(0);
}

// Handle termination signals
process.on('SIGINT', () => { log.info('Received SIGINT (Control+C)', SOURCE); gracefulShutdown(); });
process.on('SIGTERM', () => { log.info('Received SIGTERM', SOURCE); gracefulShutdown(); });

start().catch(err => { log.error(err); });
