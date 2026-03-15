const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Hiển thị thông tin và Avatar của một người dùng')
        .addUserOption(option => 
            option.setName('target')
                  .setDescription('Người dùng bạn muốn xem (để trống: xem chính mình)')
                  .setRequired(false)
        ),
    async execute(interaction) {
        // Lấy người dùng mục tiêu từ tham số, hoặc lấy người gửi nếu không nhập
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const targetMember = interaction.options.getMember('target') || interaction.member; // member dành riêng trên server này
        
        // Tạo bảng Embed
        const userEmbed = new EmbedBuilder()
            .setColor(targetMember?.displayHexColor !== '#000000' ? targetMember.displayHexColor : 0x00FF00) // Lấy màu từ role trên server nếu có
            .setTitle(`Hồ sơ của ${targetUser.username}`)
            .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '🆔 ID người dùng', value: targetUser.id, inline: true },
                { name: '🤖 Là Bot?', value: targetUser.bot ? 'Có' : 'Không', inline: true },
                { name: '🗓️ Tham gia Discord', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>`, inline: false },
            )
            .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}` })
            .setTimestamp();

        // Riêng thông tin tham gia Server (có thể null nếu bot được /user ở tin nhắn riêng)
        if (targetMember) {
            userEmbed.addFields(
                { name: '🏠 Tham gia Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>`, inline: false }
            );
        }

        // Gửi trả lại kết quả
        await interaction.reply({ embeds: [userEmbed] });
    },
};
