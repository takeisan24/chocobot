const { SlashCommandBuilder } = require('discord.js');
const { chatWithWaguri } = require('../../lib/ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Trò chuyện với Waguri 🌸')
        .addStringOption(o => o.setName('message').setDescription('Cậu muốn nói gì với Waguri?').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('message');
        const reply = await chatWithWaguri(interaction.channelId, interaction.user.id, interaction.user.username, text);
        if (!reply) {
            return interaction.editReply('Hơ, Waguri chưa trò chuyện được lúc này (chưa cấu hình AI hoặc đang lỗi). Thử lại sau nhé~ 🌸');
        }
        await interaction.editReply(reply.slice(0, 2000));
    },
};
