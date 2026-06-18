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

        // Kiểm tra xem mục tiêu có nuôi Cún bảo vệ không (Level >= 5)
        let dogBuff = false;
        let targetPetName = '';
        const targetPet = await db.getPet(target.id);
        if (targetPet && targetPet.species === 'cun') {
            const { petLevel } = require('../../data/pets');
            const dogLvl = petLevel(targetPet.exp);
            if (dogLvl >= 5) {
                dogBuff = true;
                targetPetName = targetPet.name || 'Cún con';
            }
        }

        // Cooldown (atomic) — chỉ tính khi mục tiêu hợp lệ
        const cd = await db.claimCooldown(robberId, 'rob', config.ROB.COOLDOWN_SECONDS);
        if (cd) {
            return interaction.editReply(`Cậu vừa "ra tay" xong, nghỉ chút đã nhé~ Quay lại sau <t:${Math.floor(cd / 1000)}:R>.`);
        }

        // Waguri không khuyến khích đâu nha 😟 nhưng game là game~
        const successRate = dogBuff ? (config.ROB.SUCCESS_RATE - 0.2) : config.ROB.SUCCESS_RATE;
        if (Math.random() < successRate) {
            const pct = config.ROB.STEAL_MIN_PCT + Math.random() * (config.ROB.STEAL_MAX_PCT - config.ROB.STEAL_MIN_PCT);
            const amount = Math.max(1, Math.floor(Number(tgt.wallet) * pct));
            const ok = await db.transferMoney(target.id, robberId, amount);
            if (!ok) return interaction.editReply('Hụt rồi, con mồi nhanh tay cất tiền mất tiêu~');
            const me = await db.getUser(robberId);
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.SUCCESS)
                .setTitle('🦹 Trộm thành công!')
                .setDescription(`Cậu lén lấy được **${fmt(amount)}** ${config.CURRENCY} từ ví <@${target.id}>.\n💵 Số dư của cậu: **${fmt(me?.wallet || 0)}** ${config.CURRENCY}\n*(Waguri giả vờ không thấy gì~ 🙈)*`)] });
        } else {
            const robber = await db.getUser(robberId);
            let fine = Math.floor(Number(robber.wallet) * config.ROB.FINE_PCT);
            const usedIns = await db.useInsurance(robberId, 'bh_duong_pho');
            if (usedIns) {
                fine = Math.round(fine * 0.5); // Giảm 50% tiền phạt
            }
            if (fine > 0) await db.addMoney(robberId, -fine, 'wallet');
            const robberAfter = await db.getUser(robberId);
            const displayBal = robberAfter ? Number(robberAfter.wallet) : (Number(robber.wallet) - fine);
            
            let desc = `Cậu bị bắt quả tang và phải nộp phạt **${fmt(fine)}** ${config.CURRENCY}.`;
            if (usedIns) {
                desc += `\n🛡️ **Bảo hiểm Đường phố** đã kích hoạt giúp giảm 50% tiền phạt!`;
            }
            if (dogBuff) {
                desc += `\n🐕 Bé cún **${targetPetName}** của <@${target.id}> sủa vang làm cậu giật mình bị phát hiện!`;
            }
            desc += `\n💵 Số dư của cậu: **${fmt(displayBal)}** ${config.CURRENCY}\nLần sau đừng làm vậy nữa nhé~ 😟`;

            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.ERROR)
                .setTitle('🚨 Bị tóm rồi!')
                .setDescription(desc)] });
        }
    },
};
