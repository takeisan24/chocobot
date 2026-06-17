const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

function fmtUptime(ms) {
    let s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400); s %= 86400;
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    return [d && `${d}d`, h && `${h}h`, `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ & trạng thái của bot'),
    async execute(interaction) {
        const start = Date.now();
        await interaction.deferReply();
        const rtt = Date.now() - start;
        const ws = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 API (WebSocket)', value: ws < 0 ? 'đang đo...' : `${ws}ms`, inline: true },
                { name: '⏱️ Phản hồi', value: `${rtt}ms`, inline: true },
                { name: '⏰ Online', value: fmtUptime(interaction.client.uptime), inline: true },
            )
            .setFooter({ text: 'Waguri vẫn đang chạy ngon lành~ 🌸' });
        await interaction.editReply({ embeds: [embed] });
    },
};
