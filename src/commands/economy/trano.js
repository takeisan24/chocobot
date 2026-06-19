const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { buildWaguriEmbed } = require('../../lib/embed');

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
        if (!lender || lender.id === me.id) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Cậu muốn trả nợ cho ai? Nhập @chủ nợ nhé~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const amount = interaction.options.getInteger('amount');
        const payAmt = amount && amount > 0 ? amount : 999_999_999_999; // bỏ trống = trả tối đa có thể

        const r = await db.loanRepay(me.id, lender.id, payAmt);
        if (!r) {
            const embed = buildWaguriEmbed(interaction, 'error', {
                description: 'Ơ, có lỗi khi trả nợ, thử lại sau nhé~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (r.status === 'none') {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: `Cậu không nợ <@${lender.id}> đồng nào cả~ 🌸`
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (r.status === 'poor') {
            const embed = buildWaguriEmbed(interaction, 'error', {
                title: '💵 Trả nợ',
                description: `Ví cậu đang trống, chưa trả được~ Còn nợ <@${lender.id}> **${fmt(r.remaining)}** ${config.CURRENCY}. 😟`
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const u = await db.getUser(me.id);
        const embed = buildWaguriEmbed(interaction, 'success', {
            title: '💵 Trả nợ thành công!',
            description: `Cậu đã trả <@${lender.id}> **${fmt(r.paid)}** ${config.CURRENCY}.\n` +
                (Number(r.remaining) > 0 ? `Còn nợ: **${fmt(r.remaining)}** ${config.CURRENCY}.` : '🎉 Cậu đã trả hết nợ cho người này!') +
                `\n💵 Số dư ví: **${fmt(u?.wallet || 0)}** ${config.CURRENCY}`
        });
        return interaction.editReply({ embeds: [embed] });
    },
};
