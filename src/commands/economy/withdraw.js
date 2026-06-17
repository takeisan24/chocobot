const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('withdraw')
        .setDescription('Rút tiền từ ngân hàng về ví')
        .addStringOption(o => o.setName('amount').setDescription('Số tiền hoặc "all"').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const raw = interaction.options.getString('amount');
        const user = await db.getUser(interaction.user.id);
        if (!user) return interaction.editReply('Hơ, mình chưa lấy được dữ liệu của cậu~ 🌸');

        let amount = /^(all|hết|max)$/i.test(raw) ? Number(user.bank) : parseInt(raw, 10);
        if (!Number.isFinite(amount) || amount <= 0) {
            return interaction.editReply('Số tiền không hợp lệ~ (nhập số hoặc `all`)');
        }

        const ok = await db.transferBank(interaction.user.id, amount, false);
        if (!ok) return interaction.editReply('Ngân hàng của cậu không đủ tiền để rút 😟');

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setDescription(`💵 Đã rút **${amount.toLocaleString('vi-VN')}** ${config.CURRENCY} về ví nhé~ 🌸`);
        await interaction.editReply({ embeds: [embed] });
    },
};
