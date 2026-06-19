const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vay')
        .setDescription('Xin vay tiền của người khác (họ phải đồng ý) 🤝')
        .addUserOption(o => o.setName('lender').setDescription('Người cậu muốn vay').setRequired(true))
        .addIntegerOption(o => o.setName('amount').setDescription('Số tiền muốn vay').setRequired(true).setMinValue(config.LOAN.MIN)),
    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const lender = interaction.options.getUser('lender');
        const amount = interaction.options.getInteger('amount');

        if (!lender) return interaction.editReply('Cậu muốn vay ai? Nhập @người nhé~ 🌸');
        if (lender.bot) return interaction.editReply('Bot không cho vay đâu cậu ơi~ 😄');
        if (lender.id === me.id) return interaction.editReply('Cậu không thể tự vay chính mình~ 😅');
        if (amount > config.LOAN.MAX) return interaction.editReply(`Mỗi lần vay tối đa **${fmt(config.LOAN.MAX)}** ${config.CURRENCY} thôi nhé~`);

        const due = Math.floor(amount * (1 + config.LOAN.INTEREST_PCT));
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('🤝 Lời đề nghị vay tiền')
            .setDescription(
                `<@${me.id}> muốn vay <@${lender.id}> **${fmt(amount)}** ${config.CURRENCY}.\n` +
                `Lãi **${Math.round(config.LOAN.INTEREST_PCT * 100)}%** → phải trả **${fmt(due)}** ${config.CURRENCY} trong **${config.LOAN.DUE_DAYS} ngày**.\n` +
                `*(Quá hạn, chủ nợ có quyền \`/donno\` cưỡng chế thu cả ví lẫn ngân hàng!)*\n\n<@${lender.id}> ơi, cậu có đồng ý cho vay không?`);
        const row = (dis = false) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('yes').setLabel('Cho vay 💸').setStyle(ButtonStyle.Success).setDisabled(dis),
            new ButtonBuilder().setCustomId('no').setLabel('Từ chối').setStyle(ButtonStyle.Secondary).setDisabled(dis),
        );

        const msg = await interaction.editReply({ content: `<@${lender.id}>`, embeds: [embed], components: [row()] });
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });
        let answered = false;

        collector.on('collect', async (i) => {
            if (i.user.id !== lender.id) return i.reply({ content: 'Lời đề nghị này không dành cho cậu~ 😊', flags: MessageFlags.Ephemeral });
            answered = true;
            if (i.customId === 'no') {
                await i.update({ embeds: [embed.setColor(config.COLORS.ERROR).setDescription(`<@${lender.id}> đã từ chối cho <@${me.id}> vay. 💔`)], components: [] });
                return collector.stop('done');
            }
            const r = await db.loanCreate(lender.id, me.id, amount);
            if (!r || r.status !== 'ok') {
                const txt = r?.status === 'poor' ? `<@${lender.id}> không đủ **${fmt(amount)}** ${config.CURRENCY} trong ví để cho vay 😟` : 'Ơ, có lỗi khi lập khế ước, thử lại sau nhé~';
                await i.update({ embeds: [embed.setColor(config.COLORS.ERROR).setDescription(txt)], components: [] });
                return collector.stop('done');
            }
            const ts = Math.floor(new Date(r.due_at).getTime() / 1000);
            await i.update({ embeds: [embed.setColor(config.COLORS.SUCCESS).setTitle('🤝 Đã cho vay!')
                .setDescription(`<@${lender.id}> đã cho <@${me.id}> vay **${fmt(amount)}** ${config.CURRENCY}.\n<@${me.id}> cần trả **${fmt(r.remaining)}** ${config.CURRENCY} trước <t:${ts}:R> (dùng \`/trano\`).`)], components: [] });
            collector.stop('done');
        });
        collector.on('end', async () => {
            if (!answered) await interaction.editReply({ embeds: [embed.setColor(config.COLORS.WARNING).setDescription(`<@${lender.id}> chưa trả lời kịp~ Thử lại sau nhé.`)], components: [] }).catch(() => {});
        });
    },
};
