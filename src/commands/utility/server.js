const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Hiển thị thông tin tổng quan về Server này'),
    async execute(interaction) {
        // Lấy thông tin server (guild)
        const guild = interaction.guild;
        
        // Tạo bảng Embed (Thẻ hiển thị)
        const serverEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`Thông tin Máy chủ: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '🌟 Chủ phòng', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👤 Số lượng thành viên', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Tạo ngày', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: false },
            )
            .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}` })
            .setTimestamp();

        // Phản hồi lệnh
        await interaction.reply({ embeds: [serverEmbed] });
    },
};
