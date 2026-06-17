const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thoitiet')
        .setDescription('Xem thời tiết một thành phố')
        .addStringOption(o => o.setName('thanh_pho').setDescription('Tên thành phố (vd: Hanoi, Da Nang)').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const key = process.env.WEATHER_API_KEY;
        if (!key) return interaction.editReply('Tính năng thời tiết chưa được cấu hình (thiếu `WEATHER_API_KEY`)~ 🌸');

        const city = interaction.options.getString('thanh_pho');
        try {
            const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=vi&appid=${key}`);
            if (r.status === 404) return interaction.editReply(`Mình không tìm thấy thành phố "**${city}**"~ thử tên khác nhé.`);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const d = await r.json();

            const embed = new EmbedBuilder()
                .setColor(config.COLORS.INFO)
                .setTitle(`🌤️ Thời tiết ${d.name}`)
                .setDescription(d.weather?.[0]?.description || '')
                .addFields(
                    { name: '🌡️ Nhiệt độ', value: `${Math.round(d.main.temp)}°C (cảm giác ${Math.round(d.main.feels_like)}°C)`, inline: true },
                    { name: '💧 Độ ẩm', value: `${d.main.humidity}%`, inline: true },
                    { name: '💨 Gió', value: `${d.wind.speed} m/s`, inline: true },
                );
            await interaction.editReply({ embeds: [embed] });
        } catch {
            await interaction.editReply('Hơ, không lấy được thời tiết lúc này, thử lại sau nhé~ 🌸');
        }
    },
};
