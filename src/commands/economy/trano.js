const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trano')
        .setDescription('Trả nợ cho người đã cho cậu vay 💵')
        .addUserOption(o => o.setName('lender').setDescription('Chủ nợ').setRequired(true))
        .addIntegerOption(o => o.setName('amount').setDescription('Số tiền trả (bỏ trống = trả hết có thể)').setMinValue(1)),
    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const lender = interaction.options.getUser('lender');
        if (!lender || lender.id === me.id) return interaction.editReply('Cậu muốn trả nợ cho ai? Nhập @chủ nợ nhé~ 🌸');

        const amount = interaction.options.getInteger('amount');
        const payAmt = amount && amount > 0 ? amount : 999_999_999_999; // bỏ trống = trả tối đa có thể

        const r = await db.loanRepay(me.id, lender.id, payAmt);
        if (!r) return interaction.editReply('Ơ, có lỗi khi trả nợ, thử lại sau nhé~ 🌸');
        if (r.status === 'none') return interaction.editReply(`Cậu không nợ <@${lender.id}> đồng nào cả~ 🌸`);
        if (r.status === 'poor') return interaction.editReply(`Ví cậu đang trống, chưa trả được~ Còn nợ <@${lender.id}> **${fmt(r.remaining)}** ${config.CURRENCY}. 😟`);

        const u = await db.getUser(me.id);
        return interaction.editReply(
            `✅ Cậu đã trả <@${lender.id}> **${fmt(r.paid)}** ${config.CURRENCY}.\n` +
            (Number(r.remaining) > 0 ? `Còn nợ: **${fmt(r.remaining)}** ${config.CURRENCY}.` : '🎉 Cậu đã trả hết nợ cho người này!') +
            `\n💵 Số dư ví: **${fmt(u?.wallet || 0)}** ${config.CURRENCY}`);
    },
};
