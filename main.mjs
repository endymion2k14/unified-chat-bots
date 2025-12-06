import { log, json } from './utils.mjs';
import { ClientTwitch } from './bots/twitch/bot.mjs';
import { ClientOBS } from './bots/obs/bot.mjs';
import { WebConsole } from './bots/webconsole/webconsole.mjs';

const SOURCE = 'MAIN';

const clientsDiscord = [];
const clientsTwitch = [];
const clientsOBS = [];
let webConsole;

async function start() {
    log.info('Loading settings');
    const settings = json.load('configs/secrets.json');

    // Check which bots to run
    const botsTwitch  = [];
    const botsDiscord = [];
    const botsOBS = [];
    if (settings.obs) for (let i = 0; i < settings.obs.length; i++) { if (settings.obs[i].enabled) { botsOBS.push(i); } }
    for (let i = 0; i < settings.discord.length; i++) { if (settings.discord[i].enabled) { botsDiscord.push(i); } }
    for (let i = 0; i < settings.twitch .length; i++) { if (settings.twitch [i].enabled) { botsTwitch .push(i); } }

    // Run the bots
    if (botsOBS.length > 0) {
        log.info(`Starting ${botsOBS.length} OBS bots`, SOURCE);
        for (let i = 0; i < botsOBS.length; i++) { clientsOBS.push(new ClientOBS(settings.obs[botsOBS[i]])); }
        for (let i = 0; i < clientsOBS.length; i++) { clientsOBS[i].connect(); }
    }
    if (botsDiscord.length > 0) {
        log.info(`Starting ${botsDiscord.length} discord bots`, SOURCE);
        for (let i = 0; i < botsDiscord.length; i++) {
            for (let i = 0; i < botsDiscord.length; i++) { clientsDiscord.push(0 /* TODO */); }
            for (let i = 0; i < clientsDiscord.length; i++) { /* TODO */ }
        }
    }
    if (botsTwitch .length > 0) {
        log.info(`Starting ${botsTwitch .length} twitch bots`, SOURCE);
        for (let i = 0; i < botsTwitch.length; i++) { clientsTwitch.push(new ClientTwitch(settings.twitch[botsTwitch[i]], clientsOBS)); }
        for (let i = 0; i < clientsTwitch.length; i++) { clientsTwitch[i].connect(); }
    }

    // Run the web console
    if ('console' in settings) {
            webConsole = new WebConsole(getTwitchClients, getDiscordClients, getOBSClients, settings.console);
            webConsole.start().catch(err => log.error(`${err}`, SOURCE));
    }
}

function getTwitchClients() { return clientsTwitch; }
function getDiscordClients() { return clientsDiscord; }
function getOBSClients() { return clientsOBS; }

start().catch(err => { log.error(err); });