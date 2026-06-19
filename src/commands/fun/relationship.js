const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const { AFFECTION_TIERS, tierOf } = require('../../lib/ai/persona');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('relationship')
        .setDescription('Xem mức thân thiết của cậu với Waguri 💞'),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await db.getUser(interaction.user.id);
        const aff = Number(user?.affection || 0);
        const t = tierOf(aff);

        // Tìm bậc kế tiếp (mảng xếp giảm dần theo min)
        const higher = [...AFFECTION_TIERS].reverse().find(x => x.min > aff);
        const nextLine = higher ? `Còn **${higher.min - aff}** điểm nữa để lên **${higher.name}**!` : 'Cậu đã đạt mức thân thiết cao nhất rồi đó~ 🥰';

        const embed = buildWaguriEmbed(interaction, 'info', {
            description: `Mức hiện tại: **${t.name}**\n💞 Điểm thiện cảm: **${aff}**\n\n${nextLine}`
        });

        embed.setAuthor({ name: `Thân thiết với Waguri — ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
        embed.setFooter({
            text: `Trò chuyện với Waguri (/ask hoặc @tag) để tăng thân thiết~ • ${embed.data.footer.text}`,
            iconURL: embed.data.footer.icon_url
        });

        await interaction.editReply({ embeds: [embed] });
    },
};
