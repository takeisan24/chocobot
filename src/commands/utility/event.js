const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isOwner } = require('../../lib/owner');
const { setEvent, clearEvent, getEventInfo } = require('../../lib/event');
const { buildWaguriEmbed } = require('../../lib/embed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Sự kiện nhân thu nhập/EXP toàn bot (bật/tắt chỉ owner)')
        .addSubcommand(s => s.setName('start').setDescription('Bật sự kiện (owner)')
            .addNumberOption(o => o.setName('multiplier').setDescription('Hệ số nhân (vd 2)').setRequired(true).setMinValue(1).setMaxValue(10))
            .addIntegerOption(o => o.setName('hours').setDescription('Số giờ kéo dài').setRequired(true).setMinValue(1).setMaxValue(720))
            .addStringOption(o => o.setName('name').setDescription('Tên sự kiện (vd Tết)')))
        .addSubcommand(s => s.setName('stop').setDescription('Tắt sự kiện (owner)'))
        .addSubcommand(s => s.setName('status').setDescription('Xem sự kiện hiện tại')),
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub !== 'status' && !await isOwner(interaction.client, interaction.user.id)) {
            return interaction.reply({ content: 'Chỉ owner mới bật/tắt sự kiện được nhé~ 🌸', flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply();

        if (sub === 'start') {
            const mult = interaction.options.getNumber('multiplier');
            const hours = interaction.options.getInteger('hours');
            const name = interaction.options.getString('name') || 'Sự kiện';
            await setEvent(mult, hours, name);
            const embed = buildWaguriEmbed(interaction, 'success', {
                title: '🎉 Đã bật sự kiện thành công!',
                description: `Đã bật **${name}**: nhân **x${mult}** thu nhập & EXP (/work /fish /mine /chop) trong **${hours} giờ**!`
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (sub === 'stop') {
            await clearEvent();
            const embed = buildWaguriEmbed(interaction, 'success', {
                title: '🛑 Tắt sự kiện thành công',
                description: 'Đã tắt sự kiện. Thu nhập trở về bình thường.'
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const e = getEventInfo();
        if (!e.active) {
            const embed = buildWaguriEmbed(interaction, 'info', {
                description: 'Hiện không có sự kiện nào đang chạy~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        const ts = Math.floor(e.until / 1000);
        const embed = buildWaguriEmbed(interaction, 'jackpot', {
            title: '🎉 Sự kiện đang diễn ra!',
            description: `**${e.name || 'Sự kiện'}** — nhân **x${e.mult}** thu nhập & EXP\n⏰ Kết thúc <t:${ts}:R>`
        });
        return interaction.editReply({ embeds: [embed] });
    },
};
