const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confession')
        .setDescription('Gửi confession ẩn danh (nên dùng /slash để ẩn danh)')
        .addStringOption(o => o.setName('noi_dung').setDescription('Điều cậu muốn gửi').setRequired(true)),
    async execute(interaction) {
        const content = interaction.options.getString('noi_dung');
        const gid = interaction.guild?.id;
        if (!gid) return interaction.reply({ content: 'Lệnh này chỉ dùng trong server~', flags: MessageFlags.Ephemeral });

        const s = await db.getGuildSettings(gid);
        if (!s.confession_channel) {
            return interaction.reply({ content: 'Server chưa cấu hình kênh confession. Nhờ admin gõ `/config confession-channel` nhé~ 🌸', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.guild.channels.cache.get(s.confession_channel)
            || await interaction.guild.channels.fetch(s.confession_channel).catch(() => null);
        if (!channel) {
            return interaction.reply({ content: 'Kênh confession không còn tồn tại, nhờ admin đặt lại giúp nhé~', flags: MessageFlags.Ephemeral });
        }

        const num = await db.nextConfessionNumber(gid);
        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle(`🤫 Confession #${num}`)
            .setDescription(content.slice(0, 4000))
            .setFooter({ text: 'Gửi ẩn danh qua Waguri 🌸' })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => null);
        return interaction.reply({ content: '✅ Đã gửi confession ẩn danh của cậu rồi nhé~ (không ai biết là cậu đâu)', flags: MessageFlags.Ephemeral });
    },
};
