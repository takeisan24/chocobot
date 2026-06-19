const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Tạo phòng riêng cho Waguri + hướng dẫn nhanh (cần quyền Quản lý Server)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(o => o.setName('channel').setDescription('Dùng kênh có sẵn thay vì tạo phòng mới').addChannelTypes(ChannelType.GuildText)),
    async execute(interaction) {
        if (!interaction.member?.permissions?.has?.(PermissionFlagsBits.ManageGuild)) {
            const embed = buildWaguriEmbed(interaction, 'error', {
                description: 'Cần quyền **Quản lý Server** để dùng lệnh này nhé~ 🌸'
            });
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
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
                const embed = buildWaguriEmbed(interaction, 'error', {
                    title: '⚙️ Thiết lập phòng game',
                    description: 'Mình thiếu quyền **Quản lý Kênh (Manage Channels)** để tạo phòng 😟.\nVào *Cài đặt Server → Vai trò → Waguri* bật quyền đó, hoặc mời lại mình bằng `/invite` (link đã kèm sẵn quyền), rồi chạy lại `/setup` nhé~ 🌸'
                });
                return interaction.editReply({ embeds: [embed] });
            }
            try {
                channel = await guild.channels.create({
                    name: 'waguri-game',
                    type: ChannelType.GuildText,
                    topic: 'Phòng chơi cùng Waguri 🌸 — gõ /help để xem lệnh',
                    reason: 'Waguri /setup',
                });
            } catch {
                const embed = buildWaguriEmbed(interaction, 'error', {
                    title: '⚙️ Thiết lập phòng game',
                    description: 'Ơ, mình tạo kênh không được (thiếu quyền hoặc vị trí kênh). Cấp quyền **Manage Channels** rồi chạy lại nhé~ 🌸'
                });
                return interaction.editReply({ embeds: [embed] });
            }
        }

        // Đặt kênh này làm kênh trả lời AI mặc định (gọn gàng, đổi được bằng /config ai-channel)
        await db.setGuildSetting(guild.id, 'ai_channel', channel.id);

        const intro = buildWaguriEmbed(interaction, 'info', {
            title: '🌸 Chào cả nhà, mình là Waguri!',
            description: [
                'Đây là phòng để chơi cùng mình nè~ 💕',
                '',
                '**Bắt đầu nhanh:**',
                '• `/daily` — điểm danh nhận thưởng mỗi ngày',
                '• `/work` `/fish` `/mine` `/chop` — kiếm tiền (tốn năng lượng)',
                '• `/shop` `/buy` — mua sắm · `/help` — xem tất cả lệnh',
                '• `/ask` hoặc **@tag mình** — trò chuyện nhé 💬',
            ].join('\n')
        });
        intro.setFooter({
            text: `Chúc cả nhà chơi vui~ • ${intro.data.footer.text}`,
            iconURL: intro.data.footer.icon_url
        });
        await channel.send({ embeds: [intro] }).catch(() => {});

        const embed = buildWaguriEmbed(interaction, 'success', {
            title: '⚙️ Thiết lập thành công!',
            description: `Thiết lập xong! Phòng của mình: <#${channel.id}>.\n\nMình đã đặt đây làm **kênh trả lời AI mặc định** (muốn mình trả lời ở mọi kênh thì chạy \`/config ai-channel\` và bỏ trống kênh nhé).`
        });
        await interaction.editReply({ embeds: [embed] });
    },
};
