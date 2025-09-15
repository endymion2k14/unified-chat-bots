import { concat, equals, log } from '../../utils.mjs';
import { EventEmitter } from 'node:events';
import { TwitchIRC, EventTypes } from './irc.mjs';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = 'Twitch';

const systemProperties = ['name']
const commandProperties = ['name', 'reply'];
const neededSettings = [
    'secrets.token',
    'secrets.id',
    'settings.username',
    'settings.channel',
    'name'
];

export class ClientTwitch extends EventEmitter {
    constructor(settingsJSON) {
        super();

        this._settings = settingsJSON;
        this._backend = null;
        this._commands = [];
        this._systems = [];
        this._supers = [];
        this.prefix = '!';

        this.connect = async function() {
            let valid = true;
            // Check if settings seem valid
            try {
                // Check if settings are passed
                if (!this._settings) {
                    valid = false;
                    throw('No config specified');
                }

                // Check if settings have the right parameters with data
                const missingSettings = [];
                for (let i = 0; i < neededSettings.length; i++) {
                    let parts = neededSettings[i].split('.');
                    let inner = this._settings;
                    for (let j = 0; j < parts.length; j++) {
                        if (parts[j] in inner) { inner = inner[parts[j]]; }
                        else { missingSettings.push(neededSettings[i]); break; }
                    }
                }
                if (missingSettings.length > 0) {
                    valid = false;
                    throw(`Missing config info: ${missingSettings}`);
                }
            } catch (err) { log.error(err, SOURCE); }
            if (!valid) { log.warn('Couldn\'t start bot!', SOURCE); }
            else {
                this._backend = new TwitchIRC({ username: this._settings.settings.username, oauth: this._settings.secrets.token, channel: this._settings.settings.channel } );
                if ('prefix'     in this._settings.settings) { this.prefix  = this._settings.settings.prefix    ; }
                if ('superusers' in this._settings.settings) { this._supers = this._settings.settings.superusers; }
                this._setupEvents();
                await this._setupSystems();
                this._loadCommands().catch(err => { log.error(err, `${SOURCE}-${this._settings.name}`); });
            }
        };

        this._setupEvents = function() {
            this._backend.addListener(EventTypes.connect   , event => { log.info(event.message, `${SOURCE}-${this._settings.name}`); this.emit(EventTypes.connect   , event); });
            this._backend.addListener(EventTypes.disconnect, event => { log.info(event.message, `${SOURCE}-${this._settings.name}`); this.emit(EventTypes.disconnect, event); });
            this._backend.addListener(EventTypes.ban       , event => { log.info(event.message, `${SOURCE}-${this._settings.name}`); this.emit(EventTypes.ban       , event); });
            this._backend.addListener(EventTypes.raid      , event => { log.info(event.message, `${SOURCE}-${this._settings.name}`); this.emit(EventTypes.raid      , event); });
            this._backend.addListener(EventTypes.message   , event => {
                if (event.message.startsWith(this.prefix)) {
                    this.emit(EventTypes.command, event);
                    this._parseCommand(event).catch(err => {
                        log.error(err, `${SOURCE}-${this._settings.name}`);
                    }); }
                else { this.emit(EventTypes.message, event); }
            });
        };

        this._setupSystems = async function() {
            log.info('Started loading systems', `${SOURCE}-${this._settings.name}`);
            this._systems.slice(0, this._systems.length);
            const folder = new URL('../../systems', import.meta.url);
            const systemFiles = fs.readdirSync(folder).filter(file => file.endsWith('.mjs'));
            for (const file of systemFiles) {
                const filePath = path.join(folder.toString(), file);
                let system = (await import(filePath) .catch(err => { log.error(err, `${SOURCE}-${this._settings.name}`); }).then(_ => { return _; })).default;

                // Check if system has needed properties
                let failed = false;
                for (let i = 0; i < systemProperties.length; i++) {
                    if (!(systemProperties[i] in system)) {
                        log.warn(`${filePath} is missing '${systemProperties[i]}' property.`, `${SOURCE}-${this._settings.name}`);
                        failed = true;
                    }
                }
                if (failed) { continue; } // Skip

                if ('init' in system) { system.init(this); } // Initialize system if needed
                this._systems.push({ name: system.name.toLowerCase(), system: system });
            }
            log.info('Loaded all possible systems', `${SOURCE}-${this._settings.name}`);
        };

        this._loadCommands = async function() {
            log.info('Started loading commands', `${SOURCE}-${this._settings.name}`);
            this._commands.slice(0, this._commands.length);
            const folder = new URL('../../commands', import.meta.url);
            const commandFiles = fs.readdirSync(folder).filter(file => file.endsWith('.mjs'));
            for (const file of commandFiles) {
                const filePath = path.join(folder.toString(), file);
                let command = (await import(filePath) .catch(err => { log.error(err, `${SOURCE}-${this._settings.name}`); }).then(_ => { return _; })).default;

                // Check if command has all the needed properties
                let failed = false;
                for (let i = 0; i < commandProperties.length; i++) {
                    if (!(commandProperties[i] in command)) {
                        log.warn(`${filePath} is missing '${commandProperties[i]}' property.`, `${SOURCE}-${this._settings.name}`);
                        failed = true;
                    }
                }
                if ('systems' in command) {
                    for (const system of command.systems) {
                        const find = system.toLowerCase();
                        let found = false;
                        for (let i = 0; i < this._systems.length; i++) {
                            if (equals(this._systems[i].name, find)) {
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            log.warn(`${filePath} is missing the '${system}' system it needs to function.`, `${SOURCE}-${this._settings.name}`);
                            failed = true;
                        }
                    }
                }
                if (failed) { continue; } // Skip

                // Set a new item in the Collection with the key as the command name and the value as the exported module
                this._commands.push({ name: command.name.toLowerCase(), command: command });
                const aliases = command.aliases || [];
                for (const alias of aliases) { this._commands.push({ name: alias.toLowerCase(), command: command, hidden: !!command.hidden }); }
                log.info(`Loaded command '${command.name}'${(aliases.length > 0) ? ` with aliases ['${concat(aliases, `', '`)}']` : ''}!`, `${SOURCE}-${this._settings.name}`);
            }
            log.info('Loaded all possible commands', `${SOURCE}-${this._settings.name}`);
        };

        this._parseCommand = async function(event) {
            const params = event.message.substring(this.prefix.length, event.message.length).split(' ');
            const commandName = params.shift().toLowerCase(); // Shift removes the first element from the list
            let found = false;
            for (let i = 0; i < this._commands.length; i++) {
                if (equals(commandName, this._commands[i].name)) {
                    const command = this._commands[i].command;

                    // Check if command user is superuser
                    let isSuper = false;
                    for (let i = 0; i < this._supers.length; i++) { if (equals(this._supers[i].toLowerCase(), event.username.toLowerCase())) { isSuper = true; break; } }
                    event.privileges.super = isSuper;

                    command.reply(params, this, event); // Command pass-through
                    found = true;
                    break;
                }
            }
            if (!found) { this.sendMessage(`Couldn't find the command that you tried to use ${event.username}...`); }
        }

        this.sendMessage = function(message) { this._backend.say(message).catch(err => { log.error(err, `${SOURCE}-${this._settings.name}`); }); }

        this.getSystem = function(system) {
            const find = system.toLowerCase();
            for (let i = 0; i < this._systems.length; i++) { if (equals(this._systems[i].name, find)) { return this._systems[i]; } }
            throw(`Unable to find system '${system}'!`);
        }
    }
}