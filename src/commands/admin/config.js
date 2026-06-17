const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Cấu hình bot cho server (cần quyền Quản lý Server)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('confession-channel').setDescription('Đặt kênh đăng confession')
            .addChannelOption(o => o.setName('channel').setDescription('Kênh text').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(s => s.setName('view').setDescription('Xem cấu hình hiện tại')),
    async execute(interaction) {
        // Tự enforce quyền (phòng trường hợp gọi qua prefix)
        if (!interaction.member?.permissions?.has?.(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'Cần quyền **Quản lý Server** để dùng lệnh này nhé~ 🌸', flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply();
        const gid = interaction.guild.id;
        const sub = interaction.options.getSubcommand();

        if (sub === 'confession-channel') {
            const ch = interaction.options.getChannel('channel');
            if (!ch) return interaction.editReply('Cậu chưa chọn kênh~ (nhập #kênh)');
            await db.setGuildSetting(gid, 'confession_channel', ch.id);
            return interaction.editReply(`✅ Đã đặt kênh confession là <#${ch.id}>.`);
        }

        if (sub === 'view') {
            const s = await db.getGuildSettings(gid);
            const embed = new EmbedBuilder()
                .setColor(config.COLORS.INFO)
                .setTitle('⚙️ Cấu hình server')
                .addFields({ name: 'Kênh confession', value: s.confession_channel ? `<#${s.confession_channel}>` : '*(chưa đặt)*' });
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
