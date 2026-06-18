const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hospital')
        .setDescription('🏥 Nhập viện hồi phục sức khỏe toàn diện (Tốn 10% ví, tối thiểu 500 VNĐ)'),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;

        const result = await db.hospitalHeal(userId);
        if (!result) return interaction.editReply('Ơ, có lỗi khi xử lý nhập viện rồi, thử lại sau nhé~ 🌸');

        const fmt = n => Number(n).toLocaleString('vi-VN');

        if (result.status === 'already_healthy') {
            return interaction.editReply('Cậu đang hoàn toàn khỏe mạnh (100% ❤️) mà, đâu cần vào viện đâu nè~ 🌸');
        }

        if (result.status === 'insufficient_funds') {
            return interaction.editReply(`🌸 Ví cậu không đủ tiền trả viện phí rồi 😟 — Cần tối thiểu **${fmt(result.fee)}** ${config.CURRENCY} để nhập viện nhé!`);
        }

        if (result.status === 'ok') {
            const u = await db.getUser(userId);
            const embed = new EmbedBuilder()
                .setColor(config.COLORS.SUCCESS)
                .setTitle('🏥 Bệnh Viện Waguri')
                .setDescription(`🩺 Cậu đã được bác sĩ chăm sóc đặc biệt và hồi phục sức khỏe về **100/100 ❤️**!\n💵 Viện phí đã thanh toán (10% ví): **-${fmt(result.fee)}** ${config.CURRENCY}.\n💵 Số dư ví hiện tại: **${fmt(u?.wallet || 0)}** ${config.CURRENCY}`)
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }

        return interaction.editReply('Ơ, có lỗi lạ xảy ra khi nhập viện rồi, thử lại sau nhé~ 🌸');
    },
};
