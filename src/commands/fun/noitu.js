const { SlashCommandBuilder } = require('discord.js');
const { startGame, stopGame, getGame } = require('../../lib/noitu');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noitu')
        .setDescription('Chơi nối từ tiếng Việt')
        .addSubcommand(s => s.setName('start').setDescription('Bắt đầu ván nối từ ở kênh này'))
        .addSubcommand(s => s.setName('stop').setDescription('Kết thúc ván nối từ'))
        .addSubcommand(s => s.setName('status').setDescription('Xem từ hiện cần nối')),
    async execute(interaction) {
        await interaction.deferReply();
        const sub = interaction.options.getSubcommand();
        const ch = interaction.channelId;

        if (sub === 'start') {
            if (getGame(ch)) {
                const embed = buildWaguriEmbed(interaction, 'warning', {
                    description: 'Đang có ván nối từ ở đây rồi~ Gõ `/noitu status` để xem từ hiện tại nhé.'
                });
                return interaction.editReply({ embeds: [embed] });
            }
            const { phrase, lastWord } = startGame(ch);
            const embed = buildWaguriEmbed(interaction, 'success', {
                title: '🔤 Nối Từ bắt đầu!',
                description: `Từ mở màn: **${phrase}**\nNgười tiếp theo nối bằng **cụm 2 tiếng** bắt đầu bằng **"${lastWord}"**!\n\n` +
                    '*Quy tắc: cụm 2 tiếng · không lặp lại · không đi 2 lượt liên tiếp. Waguri sẽ thả ✅/❌ cho mỗi lượt.*'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'stop') {
            const g = stopGame(ch);
            if (g) {
                const embed = buildWaguriEmbed(interaction, 'info', {
                    title: '🛑 Kết thúc nối từ!',
                    description: `Cả kênh đã nối được **${g.count}** lượt. Cậu và các bạn giỏi lắm nha~ 🌸`
                });
                return interaction.editReply({ embeds: [embed] });
            } else {
                const embed = buildWaguriEmbed(interaction, 'warning', {
                    description: 'Đang không có ván nào ở đây cả~'
                });
                return interaction.editReply({ embeds: [embed] });
            }
        }
        // status
        const g = getGame(ch);
        if (g) {
            const embed = buildWaguriEmbed(interaction, 'info', {
                title: '🔤 Trạng thái Nối Từ',
                description: `Cụm tiếp theo cần bắt đầu bằng **"${g.lastWord}"** (đã qua **${g.count}** lượt). Chờ từ của cậu nhé!`
            });
            return interaction.editReply({ embeds: [embed] });
        } else {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Chưa có ván nối từ. Gõ `/noitu start` để bắt đầu nhé!'
            });
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
