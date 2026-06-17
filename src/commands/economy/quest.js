const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const QUESTS = require('../../data/quests');

const fmt = n => Number(n).toLocaleString('vi-VN');
function bar(cur, max, size = 10) {
    const r = max > 0 ? Math.min(cur / max, 1) : 0;
    const f = Math.round(r * size);
    return '█'.repeat(f) + '░'.repeat(size - f);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('Nhiệm vụ hằng ngày (tự nhận thưởng khi xong)'),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;

        let { counters, claimed } = await db.getQuestRow(userId);

        // Tự nhận thưởng các nhiệm vụ đã hoàn thành mà chưa nhận
        let totalReward = 0;
        for (const q of QUESTS) {
            const cur = Number(counters[q.key] || 0);
            if (cur >= q.required && !claimed[q.id]) {
                const r = await db.questClaim(userId, q);
                if (r === 'ok') { totalReward += q.reward; claimed[q.id] = true; }
            }
        }

        const lines = QUESTS.map(q => {
            const cur = Math.min(Number(counters[q.key] || 0), q.required);
            const done = claimed[q.id];
            const icon = done ? '✅' : (cur >= q.required ? '🎁' : '⬜');
            return `${icon} **${q.name}** — ${cur}/${q.required}\n` +
                `　${bar(cur, q.required)} · 🪙 ${fmt(q.reward)} ${config.CURRENCY}`;
        });

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('📜 Nhiệm vụ hôm nay')
            .setDescription(lines.join('\n'))
            .setFooter({ text: 'Làm xong tự nhận thưởng khi gõ /quest · reset mỗi ngày' });

        if (totalReward > 0) {
            embed.addFields({ name: '🎉 Vừa nhận', value: `+${fmt(totalReward)} ${config.CURRENCY}!`, inline: false });
        }
        await interaction.editReply({ embeds: [embed] });
    },
};
