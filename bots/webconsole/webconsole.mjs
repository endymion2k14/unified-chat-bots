import { equals, log } from '../../utils.mjs';
import express from 'express';

const SOURCE = 'WebConsole';
const MAX_DEPTH = 20;

const app = express();

export class WebConsole {
    getTwitch = 0;
    getDiscord = 0;
    port = 0;

    constructor(functorTwitch, functorDiscord) {
        this.getTwitch  = functorTwitch;
        this.getDiscord = functorDiscord;
    }

    async start(port = 0) {
        if (port === 0) {
            log.error(`Unable to start webserver with port 0`, SOURCE);
            return;
        }
        this.port = port;
        if (this.getTwitch === 0 || this.getDiscord === 0) {
            log.error(`No functors obtained for collecting the info to display on the page `, SOURCE);
            return;
        }

        app.get('/', (req, res) => {
            let nav = '';
            let data = '';
            const twitch = this.getTwitch();
            const discord = this.getDiscord();

            for (let i = 0; i < twitch.length; i++) {
                const [objNav, objData] = this.parseObject(twitch[i]);
                nav += `<li>Twitch<ul>${objNav}</ul></li>`;
                data += `${objData}`;
            }
            for (let i = 0; i < discord.length; i++) {
                const [objNav, objData] = this.parseObject(discord[i]);
                nav += `<li>Discord<ul>${objNav}</ul></li>`;
                data += `${objData}`;
            }

            res.send(`<ul>${nav}</ul>${data}`);
        });

        app.listen(port, _ => { log.info(`WebConsole started on port ${this.port}`, SOURCE) });
    }

    parseObject(obj, depth = 0, prefix = '') {
        let nav = '';
        let data = '';
        if (depth > MAX_DEPTH) { return [nav, data]; }

        // Filter what data is being presented
        const keys = Object.keys(obj);
        const possible = [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i].toLowerCase();
            if (!(equals(key, 'secret') || equals(key, 'secrets') || equals(key, 'token') || equals(key, 'tokens')
                || equals(key, '_events') || equals(key, '_eventsCount') || equals(key, '_maxListeners') || equals(key, 'ws') || equals(key, 'client')
                || equals(typeof obj[key], 'function') || equals(typeof obj[key], 'undefined'))) {
                possible.push(keys[i]);
            }
        }

        // Recursively go through objects
        for (let i = 0; i < possible.length; i++) {
            if (equals(typeof obj[possible[i]], 'object')) {
                const [objNav, objData] = this.parseObject(obj[possible[i]], depth + 1, `${prefix}${prefix.length > 0 ? '.' : ''}${possible[i]}`);
                nav += `<li>${possible[i]}<ul>${objNav}</ul></li>`;
                if (objData.length > 0) { data += `<p id="${prefix}${prefix.length > 0 ? '.' : ''}${possible[i]}">${objData}</p>`; }
            }  else {
                nav += `<li>${possible[i]}</li>`;
                if (obj[possible[i]].length > 0) { data += `<p id="${prefix}${prefix.length > 0 ? '.' : ''}${possible[i]}">${obj[possible[i]]}</p>`; }
            }
        }

        return [nav, data];
    }
}
