const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { buildWaguriEmbed } = require('../../lib/embed');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Bắt đầu cùng Waguri — nhận quà chào mừng & hướng dẫn 🌸'),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await db.getUser(interaction.user.id);
        const onboarded = !!user?.onboarded;

        const embed = buildWaguriEmbed(interaction, 'info', {
            title: '🌸・Chào mừng cậu đến với Waguri!',
            description:
                `Rất vui được làm quen với cậu~ Mình sẽ dắt cậu vài bước đầu nha:\n\n` +
                `**1.** 🎁 \`/daily\` — điểm danh nhận thưởng mỗi ngày (có chuỗi streak!)\n` +
                `**2.** 💼 \`/work\` — đi làm kiếm tiền, rồi \`/jobs\` xin nghề xịn hơn\n` +
                `**3.** 📖 \`/help\` — xem mọi thứ mình có thể giúp cậu\n\n` +
                (onboarded
                    ? `*(Cậu đã nhận quà chào mừng rồi nha~ Cứ thoải mái khám phá nhé! 💕)*`
                    : `Bấm nút bên dưới để nhận **${fmt(config.WELCOME.BONUS)} ${config.CURRENCY} quà chào mừng** từ mình nè! 💝`)
        });

        const components = onboarded ? [] : [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('start:claim').setLabel('🎁 Nhận quà chào mừng').setStyle(ButtonStyle.Success)
            )
        ];
        await interaction.editReply({ embeds: [embed], components });
    },
};
