const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Điểm danh nhận thưởng mỗi ngày'),
    async execute(interaction) {
        await interaction.deferReply();
        const r = await db.claimDaily(interaction.user.id);
        if (!r) return interaction.editReply('Ơ, có lỗi rồi, cậu thử lại sau nhé~ 🌸');

        if (r.status === 'claimed') {
            const ts = Math.floor(new Date(r.next).getTime() / 1000);
            return interaction.editReply(`Hôm nay cậu điểm danh rồi mà~ Quay lại sau <t:${ts}:R> nhé! 🌸`);
        }

        db.questIncr(interaction.user.id, 'daily', 1); // nhiệm vụ điểm danh
        const u = await db.getUser(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setTitle('🎁 Điểm danh thành công!')
            .setDescription(`Cậu nhận được **${Number(r.reward).toLocaleString('vi-VN')}** ${config.CURRENCY}!`)
            .addFields(
                { name: '🔥 Chuỗi ngày', value: `${r.streak} ngày liên tiếp`, inline: true },
                { name: '💵 Số dư ví', value: `${Number(u?.wallet || 0).toLocaleString('vi-VN')} ${config.CURRENCY}`, inline: true },
            )
            .setFooter({ text: 'Điểm danh mỗi ngày để giữ chuỗi & thưởng cao hơn nhé~' });
        await interaction.editReply({ embeds: [embed] });
    },
};
