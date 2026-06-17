const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { startGame, stopGame, getGame } = require('../../lib/noitu');

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
            if (getGame(ch)) return interaction.editReply('Đang có ván nối từ ở đây rồi~ Gõ `/noitu status` để xem từ hiện tại nhé.');
            const { phrase, lastWord } = startGame(ch);
            return interaction.editReply({ embeds: [new EmbedBuilder()
                .setColor(config.COLORS.SUCCESS)
                .setTitle('🔤 Nối Từ bắt đầu!')
                .setDescription(
                    `Từ mở màn: **${phrase}**\nNgười tiếp theo nối bằng **cụm 2 tiếng** bắt đầu bằng **"${lastWord}"**!\n\n` +
                    '*Quy tắc: cụm 2 tiếng · không lặp lại · không đi 2 lượt liên tiếp. Waguri sẽ thả ✅/❌ cho mỗi lượt.*')] });
        }
        if (sub === 'stop') {
            const g = stopGame(ch);
            return interaction.editReply(g ? `🛑 Kết thúc nối từ! Cả kênh đã nối được **${g.count}** lượt. Giỏi lắm~ 🌸` : 'Đang không có ván nào ở đây cả~');
        }
        // status
        const g = getGame(ch);
        return interaction.editReply(g
            ? `Cụm tiếp theo cần bắt đầu bằng **"${g.lastWord}"** (đã ${g.count} lượt).`
            : 'Chưa có ván nối từ. Gõ `/noitu start` để bắt đầu nhé!');
    },
};
