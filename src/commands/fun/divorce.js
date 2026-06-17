const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('Chia tay người ấy 💔'),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await db.getUser(interaction.user.id);
        const partner = user?.partner_id;

        const r = await db.divorceUser(interaction.user.id);
        if (r === 'single') return interaction.editReply('Cậu đang độc thân mà~ Đâu có ai để chia tay đâu 😅');
        if (r !== 'ok') return interaction.editReply('Ơ, có lỗi rồi, thử lại sau nhé~ 🌸');

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.WARNING)
            .setDescription(`💔 Cậu và ${partner ? `<@${partner}>` : 'người ấy'} đã chia tay rồi. Mong cậu sớm tìm được hạnh phúc mới~ 🌸`);
        await interaction.editReply({ embeds: [embed] });
    },
};
