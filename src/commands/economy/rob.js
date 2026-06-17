const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rob')
        .setDescription('Cướp tiền trong ví người khác (rủi ro cao!)')
        .addUserOption(o => o.setName('target').setDescription('Mục tiêu').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const robberId = interaction.user.id;
        const target = interaction.options.getUser('target');

        if (!target) return interaction.editReply('Cậu định "ghé thăm" ai cơ? Nhập @người nhé~');
        if (target.bot) return interaction.editReply('Bot làm gì có ví mà cướp~ 😄');
        if (target.id === robberId) return interaction.editReply('Cậu tự cướp mình à? 🤨');

        const tgt = await db.getUser(target.id);
        if (!tgt || Number(tgt.wallet) < config.ROB.MIN_TARGET_WALLET) {
            return interaction.editReply(`Ví của <@${target.id}> trống trơn, chả có gì để lấy đâu~ 🌸`);
        }

        // Cooldown (atomic) — chỉ tính khi mục tiêu hợp lệ
        const cd = await db.claimCooldown(robberId, 'rob', config.ROB.COOLDOWN_SECONDS);
        if (cd) {
            return interaction.editReply(`Cậu vừa "ra tay" xong, nghỉ chút đã nhé~ Quay lại sau <t:${Math.floor(cd / 1000)}:R>.`);
        }

        // Waguri không khuyến khích đâu nha 😟 nhưng game là game~
        if (Math.random() < config.ROB.SUCCESS_RATE) {
            const pct = config.ROB.STEAL_MIN_PCT + Math.random() * (config.ROB.STEAL_MAX_PCT - config.ROB.STEAL_MIN_PCT);
            const amount = Math.max(1, Math.floor(Number(tgt.wallet) * pct));
            const ok = await db.transferMoney(target.id, robberId, amount);
            if (!ok) return interaction.editReply('Hụt rồi, con mồi nhanh tay cất tiền mất tiêu~');
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.SUCCESS)
                .setTitle('🦹 Trộm thành công!')
                .setDescription(`Cậu lén lấy được **${fmt(amount)}** ${config.CURRENCY} từ ví <@${target.id}>.\n*(Waguri giả vờ không thấy gì~ 🙈)*`)] });
        } else {
            const robber = await db.getUser(robberId);
            const fine = Math.floor(Number(robber.wallet) * config.ROB.FINE_PCT);
            if (fine > 0) await db.addMoney(robberId, -fine, 'wallet');
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.ERROR)
                .setTitle('🚨 Bị tóm rồi!')
                .setDescription(`Cậu bị bắt quả tang và phải nộp phạt **${fmt(fine)}** ${config.CURRENCY}.\nLần sau đừng làm vậy nữa nhé~ 😟`)] });
        }
    },
};
