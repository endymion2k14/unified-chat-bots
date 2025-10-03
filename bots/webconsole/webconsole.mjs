import { log } from '../../utils.mjs';
import express from 'express';

const app = express();
const SOURCE = 'WebConsole';

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
            res.send('Page is working!');
        });

        app.listen(port, _ => { log.info(`WebConsole started on port ${this.port}`, SOURCE) });
    }
}