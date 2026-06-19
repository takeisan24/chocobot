const { SlashCommandBuilder } = require('discord.js');
const { runCouple } = require('../../lib/couple');

const LINES = [
    '{a} rủ {b} đi hẹn hò, dạo phố ăn kem 🍦💕',
    '{a} và {b} cùng đi xem phim, nắm tay suốt buổi~ 🎬',
    '{a} đưa {b} đi ngắm hoàng hôn lãng mạn 🌅',
    '{a} và {b} có một buổi hẹn hò ngọt ngào bên nhau 💑',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('date')
        .setDescription('Rủ người ấy đi hẹn hò 💑')
        .addUserOption(o => o.setName('user').setDescription('Người cậu muốn hẹn hò').setRequired(true)),
    execute: (interaction) => runCouple(interaction, { emoji: '💑', lines: LINES, love: 5 }),
};
