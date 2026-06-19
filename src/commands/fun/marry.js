const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { buildWaguriEmbed } = require('../../lib/embed');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marry')
        .setDescription('Cầu hôn một người 💍')
        .addUserOption(o => o.setName('user').setDescription('Người cậu muốn cầu hôn').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const target = interaction.options.getUser('user');

        if (!target) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Cậu muốn cầu hôn ai? Nhập @người nhé~ 🌸'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (target.bot) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Bot không kết hôn được đâu~ 😆'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (target.id === me.id) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Cậu không thể tự cưới chính mình đâu nha~ 😅'
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const [uMe, uTarget] = await Promise.all([db.getUser(me.id), db.getUser(target.id)]);
        if (uMe?.partner_id) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: 'Cậu đang có đôi rồi mà~ Muốn cưới người khác thì `/divorce` trước nhé.'
            });
            return interaction.editReply({ embeds: [embed] });
        }
        if (uTarget?.partner_id) {
            const embed = buildWaguriEmbed(interaction, 'warning', {
                description: `<@${target.id}> đã có đôi mất rồi 💔`
            });
            return interaction.editReply({ embeds: [embed] });
        }

        const embed = buildWaguriEmbed(interaction, 'info', {
            title: '💍・Lời cầu hôn ngọt ngào',
            description: `<@${me.id}> muốn kết đôi với <@${target.id}>!\n\n<@${target.id}> ơi, cậu có đồng ý không? 🌸\n\n*(Phí tổ chức lễ cưới: **${fmt(config.MARRY.COST)}** ${config.CURRENCY} — <@${me.id}> chi trả khi thành công)*`
        });
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
                const noEmbed = buildWaguriEmbed(interaction, 'error', {
                    title: '💔・Cầu hôn thất bại',
                    description: `<@${target.id}> đã từ chối lời cầu hôn của <@${me.id}>... 💔`
                });
                await i.update({ embeds: [noEmbed], components: [] });
                return collector.stop('done');
            }
            // Phí cưới do người cầu hôn chi trả
            if (!await db.addMoney(me.id, -config.MARRY.COST, 'wallet')) {
                const poorEmbed = buildWaguriEmbed(interaction, 'error', {
                    title: '💔・Không đủ chi phí',
                    description: `<@${me.id}> không đủ **${fmt(config.MARRY.COST)}** ${config.CURRENCY} để tổ chức lễ cưới... 💔`
                });
                await i.update({ embeds: [poorEmbed], components: [] });
                return collector.stop('done');
            }
            const r = await db.marryUsers(me.id, target.id);
            if (r !== 'ok') await db.addMoney(me.id, config.MARRY.COST, 'wallet'); // hoàn phí nếu cưới hụt
            const done = r === 'ok'
                ? buildWaguriEmbed(interaction, 'success', { title: '🎉・Chúc mừng đôi uyên ương!', description: `<@${me.id}> 💞 <@${target.id}> giờ đã là một cặp! (Phí cưới **${fmt(config.MARRY.COST)}** ${config.CURRENCY}) Hạnh phúc nhé~ 🌸` })
                : buildWaguriEmbed(interaction, 'error', { description: 'Ơ, có ai đó vừa kết hôn mất rồi, không thành công 💔' });
            await i.update({ embeds: [done], components: [] });
            collector.stop('done');
        });
        collector.on('end', async () => {
            if (!answered) {
                const timeoutEmbed = buildWaguriEmbed(interaction, 'warning', {
                    title: '⏱️・Hết thời gian',
                    description: `Hết giờ rồi mà <@${target.id}> chưa trả lời... thử lại sau nhé~ 😢`
                });
                await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    },
};
