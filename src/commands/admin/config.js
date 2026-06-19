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
        .addSubcommand(s => s.setName('ai').setDescription('Bật/tắt trò chuyện AI (khi @tag Waguri)')
            .addBooleanOption(o => o.setName('enabled').setDescription('Bật AI?').setRequired(true)))
        .addSubcommand(s => s.setName('ai-channel').setDescription('Giới hạn AI chỉ trả lời ở 1 kênh (bỏ trống = mọi kênh)')
            .addChannelOption(o => o.setName('channel').setDescription('Kênh (bỏ trống để gỡ giới hạn)').addChannelTypes(ChannelType.GuildText)))
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

        if (sub === 'ai') {
            const enabled = interaction.options.getBoolean('enabled');
            await db.setGuildSetting(gid, 'ai_enabled', enabled ? '1' : '0');
            return interaction.editReply(`✅ Đã **${enabled ? 'BẬT' : 'TẮT'}** trò chuyện AI (@tag Waguri) ở server này.`);
        }

        if (sub === 'ai-channel') {
            const ch = interaction.options.getChannel('channel');
            await db.setGuildSetting(gid, 'ai_channel', ch ? ch.id : '');
            return interaction.editReply(ch
                ? `✅ AI giờ chỉ trả lời trong <#${ch.id}>.`
                : '✅ Đã gỡ giới hạn kênh — AI trả lời ở mọi kênh.');
        }

        if (sub === 'view') {
            const s = await db.getGuildSettings(gid);
            const embed = new EmbedBuilder()
                .setColor(config.COLORS.INFO)
                .setTitle('⚙️ Cấu hình server')
                .addFields(
                    { name: 'Kênh confession', value: s.confession_channel ? `<#${s.confession_channel}>` : '*(chưa đặt)*' },
                    { name: 'AI trò chuyện', value: s.ai_enabled === '0' ? '🔴 Tắt' : '🟢 Bật', inline: true },
                    { name: 'Kênh AI', value: s.ai_channel ? `<#${s.ai_channel}>` : '*(mọi kênh)*', inline: true },
                );
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
