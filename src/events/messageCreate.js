const { Events } = require('discord.js');
const config = require('../config');
const { buildPrefixInteraction } = require('../lib/prefixShim');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const prefix = config.PREFIX;
        if (!message.content.startsWith(prefix)) return;

        const tokens = message.content.slice(prefix.length).trim().split(/\s+/);
        const cmdName = (tokens.shift() || '').toLowerCase();
        if (!cmdName) return;

        const command = message.client.commands.get(cmdName);
        if (!command) return;

        try {
            const shim = await buildPrefixInteraction(message, command, tokens);
            await command.execute(shim);
        } catch (error) {
            console.error(`Lỗi prefix ${prefix}${cmdName}:`, error);
            message.reply('Ơ, có lỗi rồi, cậu thử lại sau nhé~ 🌸').catch(() => {});
        }
    },
};
