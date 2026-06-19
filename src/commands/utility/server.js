const { SlashCommandBuilder } = require('discord.js');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Hiển thị thông tin tổng quan về Server này'),
    async execute(interaction) {
        const guild = interaction.guild;
        
        const embed = buildWaguriEmbed(interaction, 'info', {
            title: `🌸 Máy chủ: ${guild.name}`,
            thumbnail: guild.iconURL({ dynamic: true }) || undefined,
            fields: [
                { name: '🌟 Chủ phòng', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👤 Thành viên', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Tạo ngày', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: false }
            ]
        }).setTimestamp();

        embed.setFooter({
            text: `Yêu cầu bởi ${interaction.user.tag} • ${embed.data.footer.text}`,
            iconURL: embed.data.footer.icon_url
        });

        await interaction.reply({ embeds: [embed] });
    },
};
