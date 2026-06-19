const { SlashCommandBuilder } = require('discord.js');
const { runCouple } = require('../../lib/couple');

const LINES = [
    '{a} ôm {b} thật chặt, ấm áp ghê~ 🤗',
    '{a} dành cho {b} một cái ôm dịu dàng 🥰',
    '{a} ôm choàng lấy {b}, không muốn buông ra luôn 💕',
    '{a} ôm {b} một cái cho hết mệt mỏi nhé~',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Ôm một người 🤗')
        .addUserOption(o => o.setName('user').setDescription('Người cậu muốn ôm').setRequired(true)),
    execute: (interaction) => runCouple(interaction, { emoji: '🤗', lines: LINES, love: 2 }),
};
