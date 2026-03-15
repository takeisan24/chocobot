const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Phản hồi lại bằng Pong! (Thử nghiệm Slash Command)'),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};
