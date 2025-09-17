import { log, json } from './utils.mjs';
import { ClientTwitch } from "./bots/twitch/bot.mjs";

const SOURCE = "MAIN";

async function start() {
    log.info("Loading settings");
    const settings = json.load("configs/secrets.json");

    // Check which bots to run
    const botsTwitch  = [];
    const botsDiscord = [];
    for (let i = 0; i < settings.discord.length; i++) { if (settings.discord[i].enabled) { botsDiscord.push(i); } }
    for (let i = 0; i < settings.twitch .length; i++) { if (settings.twitch [i].enabled) { botsTwitch .push(i); } }

    // Run the bots
    const clientsDiscord = [];
    const clientsTwitch = [];
    if (botsDiscord.length > 0) {
        log.info(`Starting ${botsDiscord.length} discord bots`, SOURCE);
        for (let i = 0; i < botsDiscord.length; i++) {
            for (let i = 0; i < botsDiscord.length; i++) { clientsDiscord.push(0 /* TODO: TMP! */); }
            for (let i = 0; i < clientsDiscord.length; i++) { /* TODO */ }
        }
    }
    if (botsTwitch .length > 0) {
        log.info(`Starting ${botsTwitch .length} twitch bots`, SOURCE);
        for (let i = 0; i < botsTwitch.length; i++) { clientsTwitch.push(new ClientTwitch(settings.twitch[botsTwitch[i]])); }
        for (let i = 0; i < clientsTwitch.length; i++) { clientsTwitch[i].connect(); }
    }
}

start().catch(err => { log.error(err); });