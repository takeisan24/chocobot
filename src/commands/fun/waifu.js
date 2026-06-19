const { SlashCommandBuilder } = require('discord.js');
const images = require('../../lib/images');
const { buildWaguriEmbed } = require('../../lib/embed');
const { restFatigue } = require('../../lib/fatigue');

module.exports = {
    data: new SlashCommandBuilder().setName('waifu').setDescription('Ảnh waifu anime ngẫu nhiên (SFW) 🌸'),
    async execute(interaction) {
        await interaction.deferReply();
        restFatigue(interaction.user.id, 1); // giải trí giảm mệt
        try {
            const url = await images.waifu();
            if (!url) throw new Error('no url');
            const embed = buildWaguriEmbed(interaction, 'info', {
                title: '🌸 Waifu cho cậu nè~',
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
