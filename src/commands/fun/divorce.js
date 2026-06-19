const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('Chia tay người ấy 💔'),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await db.getUser(interaction.user.id);
        const partner = user?.partner_id;
        if (!partner) return interaction.editReply('Cậu đang độc thân mà~ Đâu có ai để chia tay đâu 😅');

        const fee = config.MARRY.DIVORCE_COST;
        if (Number(user.wallet) < fee) {
            return interaction.editReply(`Ly hôn cần **${fmt(fee)}** ${config.CURRENCY} án phí 😅 — ví cậu chưa đủ. Kiếm thêm rồi quay lại nhé~`);
        }

        const r = await db.divorceUser(interaction.user.id);
        if (r === 'single') return interaction.editReply('Cậu đang độc thân mà~ Đâu có ai để chia tay đâu 😅');
        if (r !== 'ok') return interaction.editReply('Ơ, có lỗi rồi, thử lại sau nhé~ 🌸');
        await db.addMoney(interaction.user.id, -fee, 'wallet'); // án phí ly hôn

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.WARNING)
            .setDescription(`💔 Cậu và ${partner ? `<@${partner}>` : 'người ấy'} đã chia tay rồi. Án phí **-${fmt(fee)}** ${config.CURRENCY}. Mong cậu sớm tìm được hạnh phúc mới~ 🌸`);
        await interaction.editReply({ embeds: [embed] });
    },
};
