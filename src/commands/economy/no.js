const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

function line(loan, counterpartId) {
    const ts = Math.floor(new Date(loan.due_at).getTime() / 1000);
    const overdue = new Date(loan.due_at).getTime() < Date.now();
    return `• <@${counterpartId}> — **${fmt(loan.remaining)}** ${config.CURRENCY} · hạn <t:${ts}:R>${overdue ? ' ⚠️ **QUÁ HẠN**' : ''}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('no')
        .setDescription('Xem các khoản nợ của cậu (đang vay & cho vay) 🧾'),
    async execute(interaction) {
        await interaction.deferReply();
        const { owing, owed } = await db.loansOf(interaction.user.id);

        const owingTotal = owing.reduce((s, l) => s + Number(l.remaining), 0);
        const owedTotal = owed.reduce((s, l) => s + Number(l.remaining), 0);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('🧾 Sổ nợ của cậu')
            .addFields(
                { name: `💸 Cậu đang nợ (tổng ${fmt(owingTotal)} ${config.CURRENCY})`, value: owing.length ? owing.map(l => line(l, l.lender_id)).join('\n') : '*(không nợ ai cả~)*' },
                { name: `🤝 Người khác nợ cậu (tổng ${fmt(owedTotal)} ${config.CURRENCY})`, value: owed.length ? owed.map(l => line(l, l.borrower_id)).join('\n') : '*(chưa cho ai vay)*' },
            )
            .setFooter({ text: 'Trả nợ: /trano · Đòi nợ quá hạn: /donno' });
        await interaction.editReply({ embeds: [embed] });
    },
};
