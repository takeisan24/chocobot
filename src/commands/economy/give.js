const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Chuyển tiền (trong ví) cho người khác')
        .addUserOption(o => o.setName('target').setDescription('Người nhận').setRequired(true))
        .addIntegerOption(o => o.setName('amount').setDescription('Số tiền').setRequired(true).setMinValue(1)),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        if (!target) return interaction.editReply('Cậu muốn chuyển cho ai? Nhập @người nhận nhé~ 🌸');
        if (target.bot) return interaction.editReply('Bot không nhận tiền đâu cậu ơi~ 😄');
        if (target.id === interaction.user.id) return interaction.editReply('Cậu không thể tự chuyển cho chính mình đâu~ 😄');
        if (!amount || amount <= 0) return interaction.editReply('Số tiền phải lớn hơn 0 nhé~');

        const ok = await db.transferMoney(interaction.user.id, target.id, amount);
        if (!ok) return interaction.editReply('Ví của cậu không đủ tiền rồi 😟. Làm thêm với `/work` nhé!');

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setDescription(`💸 Cậu đã chuyển **${amount.toLocaleString('vi-VN')}** ${config.CURRENCY} cho <@${target.id}>. Tử tế ghê~ 🌸`);
        await interaction.editReply({ embeds: [embed] });
    },
};
