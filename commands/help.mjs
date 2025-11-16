import { concat } from '../utils.mjs';

export default {
    name: 'help',
    async reply(params, client, event) {
        let commandList = [];
        for (let i = 0; i < client._commands.length; i++) { if (event.privileges.super || !client._commands[i].hidden) { let mainName = client._commands[i].command.name; if (!commandList.includes(mainName)) { commandList.push(mainName); } } }
        client.sendMessage(`Possible commands: ${concat(commandList, ', ', client.prefix).toLowerCase()}`);
    }
}
