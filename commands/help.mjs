import { concat } from '../utils.mjs';

export default {
    name: 'help',
    async reply(params, client, event) {
        let commandList = [];
        for (let i = 0; i < client._commands.length; i++) { if (event.privileges.super || !client._commands[i].hidden) { commandList.push(client._commands[i].name); } }
        client.sendMessage(`Possible commands: ${concat(commandList, ', ', client.prefix).toLowerCase()}`);
    }
}
