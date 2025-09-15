import { json } from "../utils.mjs";

const config = json.load('configs/discord.json'); // TODO: make it possible for different discord links based on which bot is prompted

export default {
    name: 'discord',
    async reply(params, client, event) { client.sendMessage(config.text.toString()); },
};