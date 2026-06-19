const { SlashCommandBuilder } = require('discord.js');
const { chatWithWaguri } = require('../../lib/ai');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Trò chuyện với Waguri 🌸')
        .addStringOption(o => o.setName('message').setDescription('Cậu muốn nói gì với Waguri?').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const text = interaction.options.getString('message');
        const res = await chatWithWaguri(interaction.channelId, interaction.user.id, interaction.user.username, text);
        if (!res.ok) {
            if (res.reason === 'quota') {
                return interaction.editReply(`Hôm nay cậu đã dùng hết **${res.cap}** lượt trò chuyện với mình rồi 🥺 Quay lại ngày mai nhé~ — hoặc nâng cấp \`/premium\` để có **${config.AI.PREMIUM_DAILY} lượt/ngày** 💎`);
            }
            return interaction.editReply('Hơ, Waguri chưa trò chuyện được lúc này (chưa cấu hình AI hoặc đang lỗi). Thử lại sau nhé~ 🌸');
        }
        await interaction.editReply(res.reply.slice(0, 2000));
    },
};
