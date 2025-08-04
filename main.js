import fs from 'node:fs'
import { log } from 'utils.mjs';

async function start() {
    log.info("Starting...");




    log.info("Stopping...");
}

start().catch(err => { log.error(err); });