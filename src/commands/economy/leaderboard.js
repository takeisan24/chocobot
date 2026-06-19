const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { getLevelFromExp } = require('../../lib/leveling');
const { sendPaginated } = require('../../lib/paginate');
const { buildWaguriEmbed } = require('../../lib/embed');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Bảng xếp hạng server')
        .addStringOption(o => o.setName('type').setDescription('Xếp theo').setRequired(false)
            .addChoices({ name: 'Tài sản', value: 'networth' }, { name: 'Cấp độ', value: 'level' }, { name: 'Tình cảm cặp đôi', value: 'love' })),
    async execute(interaction) {
        await interaction.deferReply();
        const sort = interaction.options.getString('type') || 'networth';

        if (sort === 'love') {
            const top = await db.getTopLove(25);
            if (!top.length) {
                const embed = buildWaguriEmbed(interaction, 'warning', {
                    description: 'Chưa có cặp đôi nào~ Gõ `/marry` để bắt đầu nhé! 💕'
                });
                return interaction.editReply({ embeds: [embed] });
            }
            const loveLines = top.map((row, i) => `${MEDALS[i] || `**${i + 1}.**`} <@${row.user_id}> 💞 <@${row.partner_id}> — **${Number(row.love).toLocaleString('vi-VN')}** điểm`);
            return sendPaginated(interaction, { title: '💞 BXH Tình Cảm', color: config.COLORS.JACKPOT, lines: loveLines, perPage: 10 });
        }

        const rows = await db.getLeaderboard(sort, 25);
        if (!rows.length) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Chưa có ai trên bảng xếp hạng cả~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const lines = rows.map((row, i) => {
            const rank = MEDALS[i] || `**${i + 1}.**`;
            const value = sort === 'level'
                ? `Lv.${getLevelFromExp(Number(row.exp))}`
                : `${Number(row.networth).toLocaleString('vi-VN')} ${config.CURRENCY}`;
            return `${rank} <@${row.user_id}> — ${value}`;
        });

        await sendPaginated(interaction, {
            title: sort === 'level' ? '🏆 BXH Cấp độ' : '🏆 BXH Đại gia',
            color: config.COLORS.JACKPOT,
            lines,
            perPage: 10,
        });
    },
};
