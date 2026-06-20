const { SlashCommandBuilder } = require('discord.js');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Nhận trợ giúp & vào server hỗ trợ Waguri 🛟'),
    async execute(interaction) {
        await interaction.deferReply();
        const inv = process.env.SUPPORT_INVITE;
        const embed = buildWaguriEmbed(interaction, 'info', {
            title: '🛟・Hỗ trợ Waguri',
            description: inv
                ? `Cần giúp đỡ, muốn báo lỗi hay góp ý? Ghé server hỗ trợ của mình nha~ 🌸\n\n[**🛟 Vào server hỗ trợ**](${inv})`
                : 'Server hỗ trợ đang được cập nhật~ Tạm thời cậu gõ `/help` hoặc liên hệ admin nhé! 🌸',
        });
        await interaction.editReply({ embeds: [embed] });
    },
};
