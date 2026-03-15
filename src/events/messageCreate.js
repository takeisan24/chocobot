const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    execute(message) {
        // Bỏ qua tin nhắn từ bot
        if (message.author.bot) return;

        if (message.content === 'ping') {
            message.reply('pong');
        }
    },
};
