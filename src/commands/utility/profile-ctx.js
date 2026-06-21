// Context menu (chuột phải user -> Apps -> "Xem hồ sơ Waguri") — xem nhanh hồ sơ người khác.
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { getProgress } = require('../../lib/leveling');
const { createWaguriBar, buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Xem hồ sơ Waguri')
        .setType(ApplicationCommandType.User),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.targetUser;
        if (target.bot) {
            const embed = buildWaguriEmbed(interaction, 'warning', { description: 'Bot thì không có hồ sơ người chơi đâu nha~ 🌸' });
            return interaction.editReply({ embeds: [embed] });
        }

        const user = await db.getUser(target.id);
        if (!user) {
            const embed = buildWaguriEmbed(interaction, 'error', { description: 'Hơ, chưa lấy được dữ liệu, thử lại sau nhé~ 🌸' });
            return interaction.editReply({ embeds: [embed] });
        }

        const p = getProgress(Number(user.exp));
        const energy = await db.getEnergy(target.id);
        const embed = buildWaguriEmbed(interaction, 'info', {
            fields: [
                { name: '💵 Ví tiền', value: `${Number(user.wallet).toLocaleString('vi-VN')} ${config.CURRENCY}`, inline: true },
                { name: '🏦 Ngân hàng', value: `${Number(user.bank).toLocaleString('vi-VN')} ${config.CURRENCY}`, inline: true },
                { name: '⚡ Năng lượng', value: `${energy}/${config.ENERGY.MAX} ⚡`, inline: true },
                { name: '⭐ Cấp độ', value: `Lv.${p.level}`, inline: true },
                { name: `📊 Tiến trình EXP (${p.expIntoLevel}/${p.expForNextLevel})`, value: createWaguriBar(p.expIntoLevel, p.expForNextLevel, 12), inline: false },
            ],
        });
        embed.setAuthor({ name: `🌸・Hồ sơ của ${target.username}`, iconURL: target.displayAvatarURL() });
        embed.setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
