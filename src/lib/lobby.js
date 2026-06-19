const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const config = require('../config');

/**
 * Mở một sảnh chờ nhiều người chơi.
 * @param interaction - slash interaction CHƯA defer/reply
 * @param opts {title, description, minPlayers, maxPlayers, joinSeconds, validate}
 *   validate(userId, username) -> trả chuỗi lỗi (từ chối) hoặc null/undefined (cho vào). Dùng để check tiền cược.
 * @returns Promise<Array<{id,username}>|null> - danh sách người chơi khi bắt đầu, hoặc null nếu hủy/không đủ.
 */
function openLobby(interaction, opts) {
    const {
        title, description = '', minPlayers = 2, maxPlayers = 10, joinSeconds = 30, validate = null,
    } = opts;
    const hostId = interaction.user.id;
    const players = new Map(); // id -> username

    const render = (closed = false) => {
        const list = [...players.values()].map((u, i) => `\`${i + 1}.\` ${u}`).join('\n') || '*(chưa có ai)*';
        return new EmbedBuilder()
            .setColor(closed ? config.COLORS.SUCCESS : config.COLORS.INFO)
            .setTitle(title)
            .setDescription(
                `${description}\n\n**Người chơi (${players.size}/${maxPlayers}):**\n${list}\n\n` +
                (closed ? '✅ Bắt đầu!' : `Bấm **Tham gia** để vào · chủ phòng bấm **Bắt đầu** khi đủ người.\n⏰ Tự bắt đầu sau **${joinSeconds}s** (cần tối thiểu ${minPlayers} người).`))
            .setFooter({ text: `Chủ phòng: ${players.get(hostId) || interaction.user.username}` });
    };

    const buttons = () => new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('lobby_join').setLabel('Tham gia').setStyle(ButtonStyle.Success).setEmoji('🙋'),
        new ButtonBuilder().setCustomId('lobby_leave').setLabel('Rời').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('lobby_start').setLabel('Bắt đầu').setStyle(ButtonStyle.Primary),
    );

    return new Promise((resolve) => {
        (async () => {
            // Chủ phòng tự vào (kiểm tra điều kiện trước)
            if (validate) {
                const err = await validate(hostId, interaction.user.username);
                if (err) { await interaction.reply({ content: err, flags: MessageFlags.Ephemeral }); return resolve(null); }
            }
            players.set(hostId, interaction.user.username);

            await interaction.reply({ embeds: [render()], components: [buttons()] });
            const msg = await interaction.fetchReply();

            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: joinSeconds * 1000 });
            let outcome = null; // sẽ là 'start' | 'cancel'

            collector.on('collect', async (i) => {
                if (i.customId === 'lobby_join') {
                    if (players.has(i.user.id)) return i.reply({ content: 'Cậu đã ở trong phòng rồi~ 🌸', flags: MessageFlags.Ephemeral });
                    if (players.size >= maxPlayers) return i.reply({ content: 'Phòng đầy mất rồi~ 😢', flags: MessageFlags.Ephemeral });
                    if (validate) {
                        const err = await validate(i.user.id, i.user.username);
                        if (err) return i.reply({ content: err, flags: MessageFlags.Ephemeral });
                    }
                    players.set(i.user.id, i.user.username);
                    return i.update({ embeds: [render()], components: [buttons()] });
                }
                if (i.customId === 'lobby_leave') {
                    if (i.user.id === hostId) { outcome = 'cancel'; return collector.stop('cancel'); } // host rời = hủy
                    if (!players.has(i.user.id)) return i.reply({ content: 'Cậu đâu có trong phòng~', flags: MessageFlags.Ephemeral });
                    players.delete(i.user.id);
                    return i.update({ embeds: [render()], components: [buttons()] });
                }
                if (i.customId === 'lobby_start') {
                    if (i.user.id !== hostId) return i.reply({ content: 'Chỉ chủ phòng mới bắt đầu được nhé~ 🌸', flags: MessageFlags.Ephemeral });
                    if (players.size < minPlayers) return i.reply({ content: `Cần tối thiểu **${minPlayers}** người mới chơi được~`, flags: MessageFlags.Ephemeral });
                    outcome = 'start';
                    await i.update({ embeds: [render(true)], components: [] });
                    return collector.stop('start');
                }
            });

            collector.on('end', async () => {
                if (outcome === 'cancel') {
                    await interaction.editReply({ embeds: [render().setColor(config.COLORS.ERROR).setTitle(`${title} — đã hủy`)], components: [] }).catch(() => {});
                    return resolve(null);
                }
                if (players.size >= minPlayers) {
                    if (outcome !== 'start') await interaction.editReply({ embeds: [render(true)], components: [] }).catch(() => {});
                    return resolve([...players].map(([id, username]) => ({ id, username })));
                }
                await interaction.editReply({ embeds: [render().setColor(config.COLORS.WARNING).setTitle(`${title} — không đủ người`).setFooter({ text: 'Thử lại sau nhé~' })], components: [] }).catch(() => {});
                return resolve(null);
            });
        })().catch((e) => { console.error('[LOBBY ERROR]', e); resolve(null); });
    });
}

module.exports = { openLobby };
