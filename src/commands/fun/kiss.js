const { SlashCommandBuilder } = require('discord.js');
const { runCouple } = require('../../lib/couple');

const LINES = [
    '{a} hôn {b} một cái thật ngọt ngào 💋',
    '{a} trộm hôn lên má {b}, đỏ hết cả mặt~ 😚',
    '{a} và {b} trao nhau một nụ hôn dễ thương 💕',
    '{a} thơm {b} một cái chụt~ 😘',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Hôn một người 💋')
        .addUserOption(o => o.setName('user').setDescription('Người cậu muốn hôn').setRequired(true)),
    execute: (interaction) => runCouple(interaction, { emoji: '💋', lines: LINES, love: 3 }),
};
