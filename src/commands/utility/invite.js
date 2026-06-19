const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, OAuth2Scopes } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Mời Waguri về server của cậu 🌸'),
    async execute(interaction) {
        await interaction.deferReply();
        // Quyền tối thiểu để bot chạy đủ tính năng (kể cả tạm giam = Moderate Members)
        const url = interaction.client.generateInvite({
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            permissions: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.UseExternalEmojis,
                PermissionFlagsBits.ModerateMembers,
            ],
        });
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('🌸 Mời Waguri về server')
            .setDescription(`[**Bấm vào đây để mời mình nha~**](${url})\n\nMình sẽ mang cả nền kinh tế, minigame và những cuộc trò chuyện dễ thương tới server của cậu! 💕`)
            .setFooter({ text: 'Cảm ơn cậu đã yêu mến Waguri!' })] });
    },
};
