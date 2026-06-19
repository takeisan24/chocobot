const { EmbedBuilder } = require('discord.js');
const db = require('../database.js');
const { onCooldown } = require('./cooldown');

const LOVE_TIERS = [[1000, 'Phu thê viên mãn 💞'], [500, 'Khăng khít 💗'], [200, 'Mặn nồng 💖'], [50, 'Đang yêu 💕'], [0, 'Mới cưới 💌']];
const loveTier = n => (LOVE_TIERS.find(([m]) => n >= m) || [0, 'Mới cưới'])[1];

/** Logic chung cho /hug /kiss /date. opts: {emoji, lines, love} */
async function runCouple(interaction, { emoji, lines, love = 2 }) {
    await interaction.deferReply();
    const me = interaction.user;
    const target = interaction.options.getUser('user');
    if (!target) return interaction.editReply('Cậu muốn dành cho ai? Nhập @người nhé~ 🌸');
    if (target.bot) return interaction.editReply('Bot ngại lắm~ 😳');
    if (target.id === me.id) return interaction.editReply('Tự thương mình cũng tốt, nhưng rủ thêm ai đó đi nào~ 😄');

    const line = lines[Math.floor(Math.random() * lines.length)].replace(/\{a\}/g, `<@${me.id}>`).replace(/\{b\}/g, `<@${target.id}>`);
    const user = await db.getUser(me.id);

    let extra = '';
    if (user?.partner_id === target.id) {
        const cd = onCooldown('couple', me.id, 30000);
        if (!cd) {
            const r = await db.coupleLove(me.id, love);
            if (r?.status === 'ok') extra = `\n💞 Tình cảm cặp đôi: **${r.love}** — *${loveTier(Number(r.love))}*`;
        } else {
            extra = '\n💞 *(âu yếm hơi nhiều rồi, để tình cảm thấm thêm chút nhé~)*';
        }
    }
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xE91E63).setDescription(`${emoji} ${line}${extra}`)] });
}

module.exports = { runCouple, loveTier };
