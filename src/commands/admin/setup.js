const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tạo phòng riêng cho Waguri + hướng dẫn nhanh (cần quyền Quản lý Server)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(o => o.setName('channel').setDescription('Dùng kênh có sẵn thay vì tạo phòng mới').addChannelTypes(ChannelType.GuildText)),
    async execute(interaction) {
        if (!interaction.member?.permissions?.has?.(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'Cần quyền **Quản lý Server** để dùng lệnh này nhé~ 🌸', flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply();
        const guild = interaction.guild;
        const me = guild.members.me;

        // Ưu tiên kênh admin chỉ định; nếu không có thì tìm/ tạo kênh waguri-game
        let channel = interaction.options.getChannel('channel');
        if (!channel) {
            channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === 'waguri-game');
        }
        if (!channel) {
            if (!me?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.editReply('Mình thiếu quyền **Quản lý Kênh (Manage Channels)** để tạo phòng 😟.\nVào *Cài đặt Server → Vai trò → Waguri* bật quyền đó, hoặc mời lại mình bằng `/invite` (link đã kèm sẵn quyền), rồi chạy lại `/setup` nhé~ 🌸');
            }
            try {
                channel = await guild.channels.create({
                    name: 'waguri-game',
                    type: ChannelType.GuildText,
                    topic: 'Phòng chơi cùng Waguri 🌸 — gõ /help để xem lệnh',
                    reason: 'Waguri /setup',
                });
            } catch {
                return interaction.editReply('Ơ, mình tạo kênh không được (thiếu quyền hoặc vị trí kênh). Cấp quyền **Manage Channels** rồi chạy lại nhé~ 🌸');
            }
        }

        // Đặt kênh này làm kênh trả lời AI mặc định (gọn gàng, đổi được bằng /config ai-channel)
        await db.setGuildSetting(guild.id, 'ai_channel', channel.id);

        const intro = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('🌸 Chào cả nhà, mình là Waguri!')
            .setDescription([
                'Đây là phòng để chơi cùng mình nè~ 💕',
                '',
                '**Bắt đầu nhanh:**',
                '• `/daily` — điểm danh nhận thưởng mỗi ngày',
                '• `/work` `/fish` `/mine` `/chop` — kiếm tiền (tốn năng lượng)',
                '• `/shop` `/buy` — mua sắm · `/help` — xem tất cả lệnh',
                '• `/ask` hoặc **@tag mình** — trò chuyện nhé 💬',
            ].join('\n'))
            .setFooter({ text: 'Chúc cả nhà chơi vui~' });
        await channel.send({ embeds: [intro] }).catch(() => {});

        await interaction.editReply(
            `✅ Thiết lập xong! Phòng của mình: <#${channel.id}>.\n` +
            'Mình đã đặt đây làm **kênh trả lời AI mặc định** (muốn mình trả lời ở mọi kênh thì chạy `/config ai-channel` và bỏ trống kênh nhé).');
    },
};
