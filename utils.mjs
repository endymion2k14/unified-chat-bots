import fs from 'node:fs';

const SOURCE = 'JSON';

// Logging
export const log = {
    info:  function (log = '', source = 'GENERAL') { info (log, source); },
    warn:  function (log = '', source = 'GENERAL') { warn (log, source); },
    error: function (log = '', source = 'GENERAL') { error(log, source); },
    data:  function (log = '', source = 'GENERAL') { data (log, source); }
}
export function info (log = '', source = 'GENERAL') { if (log) { console.log(`[${getFullTimestamp()}] [${source}] ${log}`); } }
export function warn (log = '', source = 'GENERAL') { if (log) { console.warn(`[${getFullTimestamp()}] [${source}] ${log}`); } }
export function error(log = '', source = 'GENERAL') { if (log) { console.error(`[${getFullTimestamp()}] [${source}] ${log}`); } }
export function data (log = '', source = 'GENERAL') { if (log) { console.info(`[${getFullTimestamp()}] [${source}]`, log)} }

// Timing
export function sleep(seconds) { return new Promise(resolve => setTimeout(resolve, Math.max(seconds, 0) * 1000)); }

// Comparisons
export function equals(first, second) {
    switch (first) {
        case second: return true;
        default: return false;
    }
}

// Timestamps
const short_timespans = ['ms', 's', 'm', 'h', 'd', 'y'];
const long_timespans =  ['millisecond', 'second', 'minute', 'hour', 'day', 'year'];
const timespan_dividers = [0, 1000, 60, 60, 24, 365];

export function getFullTimestamp(date = new Date()) { return `${getDatestamp(date)} ${getTimestamp(date)}`; }
export function getDatestamp(date = new Date()) { return `${date.getDate() < 10 ? '0' : ''}${date.getDate()}-${(1 + date.getMonth()) < 10 ? '0' : ''}${1 + date.getMonth()}-${date.getFullYear()}`; }
export function getTimestamp(date = new Date()) { return `${date.toLocaleTimeString()}`; }
export function getTimeDifference(from = 0, to = 0, shortened_words = true, showMilliseconds = false) {
    const names = shortened_words ? short_timespans : long_timespans;
    const times = [];

    const fromTime = Math.min(from, to);
    const toTime = Math.max(from, to);
    let time = fromTime - toTime;

    // Calculate the time
    for (let i = 0; i < timespan_dividers.length; i) {
        // TODO
    }

    // Get first non-zero that gets displayed
    let first = 0;
    for (let i = (showMilliseconds ? 0 : 1); i < times.length; i++) {
        if (time[i] > 0) {
            first = i;
            break;
        }
    }

    // Build the string
    let result = '';
    for (let i = times.length - 1; i >= (showMilliseconds ? 0 : 1); i--) {
        if (times[i] > 0) { result += `${result.length > 0 ? (i === first ? ' and ' : ', ') : ''}${times[i]}${names[i]}`; }
    }
    return result;
}

// File handling
export const json = {
    save: function (source, data) { const filepath = new URL(source, import.meta.url); try { fs.writeFileSync(filepath, JSON.stringify(data, null, 2)); } catch (e) { log.warn(`JSON file was not able to be overwritten, does the file exist?`, SOURCE) } },
    load: function (source) { return JSON.parse(fs.readFileSync(new URL(source, import.meta.url))); }
}

// String manipulation
export function concat(list, separator = '', prefix = '', start = 0, count = list.length) {
    const end = Math.min(start + count, list.length);
    let result = '';
    for (let i = start; i < end; i++) { result += (i <= start ? '' : separator) + prefix + list[i]; }
    return result;
}

// Randomizing
export function randomInt(min, max) { return Math.floor(Math.min(+min, +max)) + Math.floor(Math.random() * (Math.max(+min, +max) - Math.min(+min, +max))); }