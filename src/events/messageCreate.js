const { Events } = require('discord.js');
const config = require('../config');
const { buildPrefixInteraction } = require('../lib/prefixShim');
const { chatWithWaguri, onCooldown } = require('../lib/ai');
const { handleMessage: handleNoiTu } = require('../lib/noitu');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const prefix = config.PREFIX;

        // --- 1) Lệnh prefix (vd: w!work) ---
        if (message.content.startsWith(prefix)) {
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
            return;
        }

        // --- 2) Trò chuyện AI khi @mention Waguri ---
        if (message.mentions.has(message.client.user, { ignoreEveryone: true, ignoreRoles: true })) {
            const text = message.content.replace(/<@!?\d+>/g, '').trim();
            if (!text) return;
            if (onCooldown(message.author.id)) return;
            await message.channel.sendTyping().catch(() => {});
            const reply = await chatWithWaguri(message.channelId, message.author.id, message.author.username, text);
            if (reply) message.reply(reply.slice(0, 2000)).catch(() => {});
            return;
        }

        // --- 3) Nối từ (nếu kênh đang có ván) ---
        await handleNoiTu(message);
    },
};
