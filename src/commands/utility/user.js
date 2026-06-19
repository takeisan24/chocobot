const { SlashCommandBuilder } = require('discord.js');
const { buildWaguriEmbed } = require('../../lib/embed');

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
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const targetMember = interaction.options.getMember('target') || interaction.member; // member dành riêng trên server này
        
        const embed = buildWaguriEmbed(interaction, 'info', {
            title: `🌸 Hồ sơ của ${targetUser.username}`,
            image: targetUser.displayAvatarURL({ dynamic: true, size: 1024 }),
            fields: [
                { name: '🆔 ID người dùng', value: targetUser.id, inline: true },
                { name: '🤖 Là Bot?', value: targetUser.bot ? 'Có' : 'Không', inline: true },
                { name: '🗓️ Tham gia Discord', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D>`, inline: false }
            ]
        }).setTimestamp();

        if (targetMember) {
            embed.addFields(
                { name: '🏠 Tham gia Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>`, inline: false }
            );
        }

        embed.setFooter({
            text: `Yêu cầu bởi ${interaction.user.tag} • ${embed.data.footer.text}`,
            iconURL: embed.data.footer.icon_url
        });

        await interaction.reply({ embeds: [embed] });
    },
};
