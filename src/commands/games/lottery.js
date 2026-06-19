const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

// Thông báo nếu vòng cũ vừa được quay (lazy draw) trong lượt tương tác này.
function drawLine(draw) {
    if (draw && draw.drawn) {
        return `\n\n🎉 **Vòng #${draw.round} vừa quay!** <@${draw.winner}> ôm trọn **${fmt(draw.prize)}** ${config.CURRENCY} (${draw.total_tickets} vé)! 🎊`;
    }
    return '';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('Xổ số cộng đồng 🎟️ — gom vé, ai trúng ôm cả hũ!')
        .addSubcommand(s => s.setName('info').setDescription('Xem hũ thưởng & vé của cậu'))
        .addSubcommand(s => s.setName('buy').setDescription('Mua vé xổ số')
            .addIntegerOption(o => o.setName('count').setDescription('Số vé muốn mua').setRequired(true).setMinValue(1).setMaxValue(config.LOTTERY.MAX_PER_BUY))),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const sub = interaction.options.getSubcommand();

        if (sub === 'buy') {
            const count = interaction.options.getInteger('count');
            const r = await db.lotteryBuy(userId, count);
            if (!r) return interaction.editReply('Ơ, lỗi xổ số, thử lại sau nhé~ 🌸');
            if (r.status === 'poor') {
                return interaction.editReply(`Cậu cần **${fmt(r.cost)}** ${config.CURRENCY} để mua ${count} vé mà ví chưa đủ~ 😟${drawLine(r.draw)}`);
            }
            const endTs = Math.floor(new Date(r.ends_at).getTime() / 1000);
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.SUCCESS)
                .setTitle('🎟️ Mua vé xổ số')
                .setDescription(
                    `Cậu mua **${count} vé** (**-${fmt(r.cost)}** ${config.CURRENCY}).\n` +
                    `🎫 Vé của cậu vòng này: **${fmt(r.my_tickets)}**\n` +
                    `💰 Hũ thưởng: **${fmt(r.pool)}** ${config.CURRENCY}\n` +
                    `⏰ Quay <t:${endTs}:R>${drawLine(r.draw)}`)] });
        }

        // info
        const v = await db.lotteryView(userId);
        if (!v) return interaction.editReply('Ơ, lỗi xổ số, thử lại sau nhé~ 🌸');
        const endTs = Math.floor(new Date(v.ends_at).getTime() / 1000);
        const prize = Math.floor(Number(v.pool) * (1 - config.LOTTERY.HOUSE_CUT));
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(config.COLORS.JACKPOT)
            .setTitle('🎟️ Xổ Số Cộng Đồng')
            .setDescription(
                `💰 Hũ thưởng vòng **#${v.round}**: **${fmt(v.pool)}** ${config.CURRENCY}\n` +
                `🏆 Người trúng nhận: **${fmt(prize)}** ${config.CURRENCY} *(nhà cái giữ ${Math.round(config.LOTTERY.HOUSE_CUT * 100)}%)*\n` +
                `🎫 Giá vé: **${fmt(config.LOTTERY.TICKET_PRICE)}** ${config.CURRENCY} · Vé của cậu: **${fmt(v.my_tickets)}**/${fmt(v.total_tickets)}\n` +
                `⏰ Quay <t:${endTs}:R>` +
                (v.last_winner ? `\n\n🎉 Vòng #${v.last_round}: <@${v.last_winner}> đã trúng **${fmt(v.last_prize)}** ${config.CURRENCY}!` : ''))
            .setFooter({ text: 'Mua vé: /lottery buy <số vé> — vé càng nhiều, cơ hội càng cao!' })] });
    },
};
