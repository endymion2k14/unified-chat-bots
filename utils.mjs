import fs from "node:fs";

// Logging
export const log = {
    info:  function (log = "", source = "GENERAL") { info (log, source); },
    warn:  function (log = "", source = "GENERAL") { warn (log, source); },
    error: function (log = "", source = "GENERAL") { error(log, source); }
}
export function info (log = "", source = "GENERAL") { if (log) { console.log(`[${getFullTimestamp()}] [${source}] ${log}`); } }
export function warn (log = "", source = "GENERAL") { if (log) { console.warn(`[${getFullTimestamp()}] [${source}] ${log}`); } }
export function error(log = "", source = "GENERAL") { if (log) { console.error(`[${getFullTimestamp()}] [${source}] ${log}`); } }

// Timing
export function sleep(seconds) { return new Promise(resolve => setTimeout(resolve, Math.max(seconds, 0) * 1000)); }

// Timestamps
export function getFullTimestamp(date = new Date()) { return `${getDatestamp(date)} ${getTimestamp(date)}`; }
export function getDatestamp(date = new Date()) { return `${date.getDate() < 10 ? '0' : ''}${date.getDate()}-${(1 + date.getMonth()) < 10 ? '0' : ''}${1 + date.getMonth()}-${date.getFullYear()}`; }
export function getTimestamp(date = new Date()) { return `${date.toLocaleTimeString()}`; }

// File handling
export const json = {
    save: function (source, data) { fs.writeFileSync(new URL(source, import.meta.url), JSON.stringify(data, null, 2)); },
    load: function (source) { return JSON.parse(fs.readFileSync(new URL(source, import.meta.url))); }
}

// String manipulation
export function concat(list, separator = "", prefix = "", start = 0, count = list.length) {
    const end = Math.min(start + count, list.length);
    let result = "";
    for (let i = start; i < end; i++) { result += (i <= start ? "" : separator) + prefix + list[i]; }
    return result;
}