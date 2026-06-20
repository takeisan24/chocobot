const { SlashCommandBuilder } = require('discord.js');
const images = require('../../lib/images');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder().setName('cat').setDescription('Ảnh mèo ngẫu nhiên 🐱'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const url = await images.cat();
            if (!url) throw new Error('no url');
            const embed = buildWaguriEmbed(interaction, 'info', {
                title: '🐱 Mèo cho cậu nè~',
                image: url
            });
            await interaction.editReply({ embeds: [embed] });
        } catch {
            const embedErr = buildWaguriEmbed(interaction, 'error', {
                description: 'Hơ, không lấy được ảnh lúc này, thử lại sau nhé~ 🌸'
            });
            await interaction.editReply({ embeds: [embedErr] });
        }
    },
};
