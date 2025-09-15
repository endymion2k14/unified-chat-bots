import { randomInt } from '../utils.mjs';

export default {
    name: 'smurt',
    async reply(params, client, event) { client.sendMessage(messages[randomInt(0,  messages.length) % messages.length]); } // TODO: test if it is inclusive and remove modulo if possible
};

const messages = [
    'Smurt!',
    'Very smurt indeed!',
    'That\'s very smurt!',
    'You are very smurt!',
    'Smurt move!'
];