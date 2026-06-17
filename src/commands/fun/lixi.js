const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { parseAmount } = require('../../lib/amount');

const fmt = n => Number(n).toLocaleString('vi-VN');

// Chia total thành parts phần ngẫu nhiên, mỗi phần >= 1
function splitMoney(total, parts) {
    const arr = new Array(parts).fill(1);
    let rem = total - parts;
    while (rem-- > 0) arr[Math.floor(Math.random() * parts)]++;
    return arr;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lixi')
        .setDescription('Phát lì xì cho cả kênh 🧧')
        .addStringOption(o => o.setName('amount').setDescription('Tổng tiền lì xì (vd 10000, 10k, all)').setRequired(true))
        .addIntegerOption(o => o.setName('parts').setDescription('Số bao lì xì (mặc định 5)').setMinValue(1).setMaxValue(20)),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const user = await db.getUser(userId);
        if (!user) return interaction.editReply('Hơ, lỗi dữ liệu, thử lại sau nhé~ 🌸');

        let amount = parseAmount(interaction.options.getString('amount'), Number(user.wallet));
        let parts = interaction.options.getInteger('parts') || 5;
        if (!amount || amount < parts) {
            return interaction.editReply(`Số tiền không hợp lệ~ (tối thiểu **${parts}** ${config.CURRENCY} cho ${parts} bao)`);
        }
        if (parts > amount) parts = amount;

        if (!await db.addMoney(userId, -amount, 'wallet')) {
            return interaction.editReply('Ví cậu không đủ để phát lì xì rồi 😟');
        }

        const portions = splitMoney(amount, parts);
        const claimed = new Map(); // userId -> số tiền nhận

        const row = (disabled = false) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('grab')
                .setLabel(`Cướp lì xì 🧧 (còn ${portions.length})`)
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled || portions.length === 0));

        const render = (closed = false) => new EmbedBuilder()
            .setColor(config.COLORS.JACKPOT)
            .setTitle('🧧 LÌ XÌ MAY MẮN 🧧')
            .setDescription(
                `<@${userId}> phát **${fmt(amount)}** ${config.CURRENCY} cho **${parts}** người!\n` +
                (claimed.size ? '\n' + [...claimed].map(([u, a]) => `🧧 <@${u}> +${fmt(a)} ${config.CURRENCY}`).join('\n') : '') +
                (closed ? '\n\n*Hết lì xì rồi~ Cảm ơn cậu đã hào phóng! 🌸*' : '\n\nNhanh tay bấm nút cướp nào! 👇'))
            .setFooter({ text: `${parts - portions.length}/${parts} bao đã được nhận` });

        const msg = await interaction.editReply({ embeds: [render()], components: [row()] });
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

        collector.on('collect', async (i) => {
            if (i.user.id === userId) return i.reply({ content: 'Không tự cướp lì xì của mình được đâu~ 😆', flags: MessageFlags.Ephemeral });
            if (claimed.has(i.user.id)) return i.reply({ content: 'Cậu cướp rồi mà, để dành cho người khác nhé~ 🌸', flags: MessageFlags.Ephemeral });
            if (portions.length === 0) return i.reply({ content: 'Hết lì xì mất rồi 😢', flags: MessageFlags.Ephemeral });

            const got = portions.pop();
            claimed.set(i.user.id, got);
            await db.addMoney(i.user.id, got, 'wallet');
            await i.update({ embeds: [render(portions.length === 0)], components: [row(portions.length === 0)] });
            if (portions.length === 0) collector.stop('done');
        });

        collector.on('end', async () => {
            // Hoàn lại các bao chưa ai cướp cho người phát
            const leftover = portions.reduce((s, x) => s + x, 0);
            if (leftover > 0) await db.addMoney(userId, leftover, 'wallet');
            await interaction.editReply({ embeds: [render(true)], components: [row(true)] }).catch(() => {});
        });
    },
};
