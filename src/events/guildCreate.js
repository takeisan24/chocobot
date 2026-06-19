const { Events, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        try {
            const me = guild.members.me;
            const canSend = ch => ch
                && ch.type === ChannelType.GuildText
                && ch.permissionsFor(me)?.has(PermissionsBitField.Flags.SendMessages);

            // Ưu tiên kênh hệ thống, không thì tìm kênh text đầu tiên gửi được
            let channel = canSend(guild.systemChannel) ? guild.systemChannel : guild.channels.cache.find(canSend);
            if (!channel) return;

            const { buildWaguriEmbed } = require('../lib/embed');
            const embed = buildWaguriEmbed({ client: guild.client }, 'info', {
                title: '🌸・Xin chào, mình là Waguri!',
                thumbnail: config.WAGURI_IMAGES.MAIN,
                description:
                    `*Hân hạnh được chào đón các quý khách ghé thăm tiệm bánh Gekka!* 🍰\n\n` +
                    `Cảm ơn cậu rất nhiều vì đã mời tớ ghé thăm **${guild.name}**! Tớ sẽ là người bạn đồng hành kiêm "quản lý tiệm bánh" siêu năng nổ của cậu đó~\n\n` +
                    `**✨ Các Dịch Vụ Tại Tiệm:**\n` +
                    `> 💬 **Trò chuyện cùng Waguri:** Gõ \`/ask\` hoặc tag tớ để tớ chia sẻ chuyện học ở Kikyo hay làm bánh cùng Rintaro nha!\n` +
                    `> 💼 **Lao động & Kinh tế:** Kiếm tiền mua bánh ngọt qua \`/work\`, nhận trợ cấp \`/daily\`, mua sắm \`/shop\`.\n` +
                    `> 🎲 **Giải trí cùng bạn bè:** Thử sức với \`/taixiu\`, \`/blackjack\`, \`/masoi\` cực kỳ kịch tính.\n` +
                    `> 📜 **Sổ tay hướng dẫn:** Gõ \`/help\` để tớ chỉ dẫn chi tiết cách dùng các lệnh nhé!\n\n` +
                    `*Hy vọng chúng mình sẽ có những kỷ niệm thật ngọt ngào bên nhau!* 🌸`
            });
            embed.setFooter({
                text: `Hỗ trợ cả tiền tố ${config.PREFIX} (ví dụ: ${config.PREFIX}help) • Cùng chơi vui vẻ nha!`,
                iconURL: guild.client.user.displayAvatarURL()
            });

            await channel.send({ embeds: [embed] });
            console.log(`[GUILD JOIN] Đã gửi lời chào tới "${guild.name}" (${guild.id})`);
        } catch (error) {
            console.error('[GUILD JOIN] Lỗi gửi lời chào:', error);
        }
    },
};
