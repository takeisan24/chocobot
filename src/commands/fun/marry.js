const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marry')
        .setDescription('Cầu hôn một người 💍')
        .addUserOption(o => o.setName('user').setDescription('Người cậu muốn cầu hôn').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const target = interaction.options.getUser('user');

        if (!target) return interaction.editReply('Cậu muốn cầu hôn ai? Nhập @người nhé~ 🌸');
        if (target.bot) return interaction.editReply('Bot không kết hôn được đâu~ 😆');
        if (target.id === me.id) return interaction.editReply('Cậu không thể tự cưới chính mình đâu nha~ 😅');

        const [uMe, uTarget] = await Promise.all([db.getUser(me.id), db.getUser(target.id)]);
        if (uMe?.partner_id) return interaction.editReply('Cậu đang có đôi rồi mà~ Muốn cưới người khác thì `/divorce` trước nhé.');
        if (uTarget?.partner_id) return interaction.editReply(`<@${target.id}> đã có đôi mất rồi 💔`);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle('💍 Lời cầu hôn')
            .setDescription(`<@${me.id}> muốn kết đôi với <@${target.id}>!\n\n<@${target.id}> ơi, cậu có đồng ý không? 🌸`);
        const row = (disabled = false) => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('yes').setLabel('Đồng ý 💖').setStyle(ButtonStyle.Success).setDisabled(disabled),
            new ButtonBuilder().setCustomId('no').setLabel('Từ chối 💔').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        );

        const msg = await interaction.editReply({ content: `<@${target.id}>`, embeds: [embed], components: [row()] });
        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000 });

        let answered = false;
        collector.on('collect', async (i) => {
            if (i.user.id !== target.id) {
                return i.reply({ content: 'Lời cầu hôn này không dành cho cậu đâu~ 😊', flags: MessageFlags.Ephemeral });
            }
            answered = true;
            if (i.customId === 'no') {
                await i.update({ embeds: [embed.setColor(config.COLORS.ERROR).setDescription(`<@${target.id}> đã từ chối lời cầu hôn của <@${me.id}>... 💔`)], components: [] });
                return collector.stop('done');
            }
            const r = await db.marryUsers(me.id, target.id);
            const done = r === 'ok'
                ? embed.setColor(config.COLORS.SUCCESS).setTitle('🎉 Chúc mừng đôi uyên ương!').setDescription(`<@${me.id}> 💞 <@${target.id}> giờ đã là một cặp! Hạnh phúc nhé~ 🌸`)
                : embed.setColor(config.COLORS.ERROR).setDescription('Ơ, có ai đó vừa kết hôn mất rồi, không thành công 💔');
            await i.update({ embeds: [done], components: [] });
            collector.stop('done');
        });
        collector.on('end', async () => {
            if (!answered) {
                await interaction.editReply({ embeds: [embed.setColor(config.COLORS.WARNING).setDescription(`Hết giờ rồi mà <@${target.id}> chưa trả lời... thử lại sau nhé~ 😢`)], components: [] }).catch(() => {});
            }
        });
    },
};
