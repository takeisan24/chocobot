const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donno')
        .setDescription('Đòi nợ — khoản QUÁ HẠN sẽ bị cưỡng chế thu (cả ví lẫn ngân hàng) 🧾')
        .addUserOption(o => o.setName('borrower').setDescription('Con nợ').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const borrower = interaction.options.getUser('borrower');
        if (!borrower || borrower.id === me.id) return interaction.editReply('Cậu muốn đòi nợ ai? Nhập @con nợ nhé~ 🌸');

        const r = await db.loanCollect(me.id, borrower.id);
        if (!r) return interaction.editReply('Ơ, có lỗi khi đòi nợ, thử lại sau nhé~ 🌸');
        if (r.status === 'not_overdue') {
            return interaction.editReply(`<@${borrower.id}> chưa có khoản nào **quá hạn** để đòi (hoặc không nợ cậu). Kiên nhẫn chút nha~ 🌸`);
        }
        if (r.status === 'broke') {
            return interaction.editReply(`<@${borrower.id}> đang **cháy túi**, chưa moi được đồng nào 😤 Khoản quá hạn còn lại: **${fmt(r.overdue)}** ${config.CURRENCY}.`);
        }
        return interaction.editReply(
            `🧾 Cậu đã cưỡng chế thu của <@${borrower.id}> **${fmt(r.collected)}** ${config.CURRENCY} ` +
            `*(ví ${fmt(r.from_wallet)} + ngân hàng ${fmt(r.from_bank)})*.\n` +
            (Number(r.overdue_left) > 0 ? `Còn nợ quá hạn: **${fmt(r.overdue_left)}** ${config.CURRENCY} — đòi tiếp khi nó có tiền nhé!` : '🎉 Đã thu đủ phần quá hạn!'));
    },
};
