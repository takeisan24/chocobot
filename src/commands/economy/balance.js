const { SlashCommandBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { getProgress } = require('../../lib/leveling');
const { createWaguriBar, buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Xem ví, ngân hàng và cấp độ')
        .addUserOption(o => o.setName('target').setDescription('Người muốn xem (mặc định: bạn)').setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('target') || interaction.user;

        const user = await db.getUser(target.id);
        if (!user) {
            const embed = buildWaguriEmbed(interaction, 'error', {
                description: 'Hơ, mình chưa lấy được dữ liệu của cậu, thử lại sau chút nhé~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const p = getProgress(Number(user.exp));
        const wallet = Number(user.wallet).toLocaleString('vi-VN');
        const bank = Number(user.bank).toLocaleString('vi-VN');
        const energy = await db.getEnergy(target.id);

        const embed = buildWaguriEmbed(interaction, 'info', {
            fields: [
                { name: '💵 Ví tiền', value: `${wallet} ${config.CURRENCY}`, inline: true },
                { name: '🏦 Ngân hàng', value: `${bank} ${config.CURRENCY}`, inline: true },
                { name: '⚡ Năng lượng', value: `${energy}/${config.ENERGY.MAX} ⚡`, inline: true },
                { name: '⭐ Cấp độ', value: `Lv.${p.level}`, inline: true },
                { name: `📊 Tiến trình EXP (${p.expIntoLevel}/${p.expForNextLevel})`, value: createWaguriBar(p.expIntoLevel, p.expForNextLevel, 12), inline: false }
            ]
        });

        embed.setAuthor({ name: `🌸・Tài khoản của ${target.username}`, iconURL: target.displayAvatarURL() });

        // Buff đang chạy (nếu có)
        if (user.buff_expires_at && new Date(user.buff_expires_at).getTime() > Date.now()) {
            const minsLeft = Math.ceil((new Date(user.buff_expires_at).getTime() - Date.now()) / 60000);
            const pct = Math.round((Number(user.buff_mult) - 1) * 100);
            embed.addFields({ name: '🍗 Hiệu ứng Buff', value: `+${pct}% thu nhập (còn ${minsLeft} phút)`, inline: false });
            embed.setFooter({
                text: `🍗 Đang chạy buff +${pct}% · ${embed.data.footer.text}`,
                iconURL: embed.data.footer.icon_url
            });
        }

        embed.setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
