const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const { getLevelFromExp } = require('../../lib/leveling');

const fmt = n => Number(n).toLocaleString('vi-VN');
const clanLevel = xp => Math.floor(Math.sqrt(Number(xp || 0) / 10000)) + 1;
const warCooldown = new Map(); // clanId -> hết cooldown (ms)
const clanPower = exps => exps.reduce((s, e) => s + getLevelFromExp(e) + 1, 0);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Bang hội 🏰 — lập bang, gia nhập, quỹ chung')
        .addSubcommand(s => s.setName('create').setDescription(`Lập bang mới (tốn ${50000} VNĐ)`)
            .addStringOption(o => o.setName('name').setDescription('Tên bang').setRequired(true).setMaxLength(30)))
        .addSubcommand(s => s.setName('join').setDescription('Gia nhập một bang')
            .addStringOption(o => o.setName('name').setDescription('Tên bang').setRequired(true)))
        .addSubcommand(s => s.setName('leave').setDescription('Rời bang'))
        .addSubcommand(s => s.setName('info').setDescription('Xem thông tin bang')
            .addStringOption(o => o.setName('name').setDescription('Tên bang (mặc định: bang của cậu)')))
        .addSubcommand(s => s.setName('list').setDescription('Bảng xếp hạng bang (theo quỹ)'))
        .addSubcommand(s => s.setName('deposit').setDescription('Góp tiền vào quỹ bang')
            .addIntegerOption(o => o.setName('amount').setDescription('Số tiền').setRequired(true).setMinValue(1)))
        .addSubcommand(s => s.setName('withdraw').setDescription('Rút quỹ bang (chỉ trưởng bang)')
            .addIntegerOption(o => o.setName('amount').setDescription('Số tiền').setRequired(true).setMinValue(1)))
        .addSubcommand(s => s.setName('kick').setDescription('Đuổi thành viên (chỉ trưởng bang)')
            .addUserOption(o => o.setName('user').setDescription('Thành viên').setRequired(true)))
        .addSubcommand(s => s.setName('disband').setDescription('Giải tán bang (chỉ trưởng bang)'))
        .addSubcommand(s => s.setName('war').setDescription('Khai chiến với bang khác (chỉ trưởng bang)')
            .addStringOption(o => o.setName('clan').setDescription('Tên bang đối thủ').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply();
        const me = interaction.user;
        const sub = interaction.options.getSubcommand();
        const C = config.CURRENCY;

        if (sub === 'create') {
            const name = interaction.options.getString('name').trim();
            const r = await db.clanCreate(me.id, name);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { in_clan: 'Cậu đang ở trong một bang rồi~ Rời bang trước đã nhé.', name_taken: 'Tên bang này đã có người dùng rồi~', poor: `Cần **${fmt(config.CLAN.CREATE_COST)}** ${C} để lập bang mà ví chưa đủ~ 😟` }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply(`🏰 Chúc mừng! Cậu đã lập bang **${name}** (phí ${fmt(config.CLAN.CREATE_COST)} ${C}). Rủ bạn bè \`/clan join ${name}\` nhé~`);
        }

        if (sub === 'join') {
            const name = interaction.options.getString('name').trim();
            const r = await db.clanJoin(me.id, name);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { in_clan: 'Cậu đang ở trong một bang rồi~', notfound: 'Không tìm thấy bang này~' }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply(`🏰 Cậu đã gia nhập bang **${r.name}**! Chào mừng tân binh~ 🎉`);
        }

        if (sub === 'leave') {
            const r = await db.clanLeave(me.id);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { not_in: 'Cậu đâu có ở bang nào~', is_leader: 'Cậu là trưởng bang — phải `/clan disband` hoặc chuyển giao trước nhé.' }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply('👋 Cậu đã rời bang. Hẹn gặp lại~');
        }

        if (sub === 'deposit') {
            const amount = interaction.options.getInteger('amount');
            const r = await db.clanDeposit(me.id, amount);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            if (r.status === 'not_in') return interaction.editReply('Cậu chưa ở bang nào~');
            if (r.status === 'poor') return interaction.editReply('Ví cậu không đủ để góp~ 😟');
            return interaction.editReply(`💰 Cậu đã góp **${fmt(amount)}** ${C} vào quỹ bang. Quỹ hiện có: **${fmt(r.bank)}** ${C}.`);
        }

        if (sub === 'withdraw') {
            const amount = interaction.options.getInteger('amount');
            const r = await db.clanWithdraw(me.id, amount);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { not_in: 'Cậu chưa ở bang nào~', not_leader: 'Chỉ trưởng bang mới rút quỹ được nhé~', poor_clan: `Quỹ bang chỉ còn **${fmt(r.bank)}** ${C}, không đủ~` }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply(`💸 Đã rút **${fmt(amount)}** ${C} từ quỹ bang về ví của cậu.`);
        }

        if (sub === 'kick') {
            const target = interaction.options.getUser('user');
            const r = await db.clanKick(me.id, target.id);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { not_in: 'Cậu chưa ở bang nào~', not_leader: 'Chỉ trưởng bang mới đuổi được~', self: 'Không tự đuổi mình được đâu~ 😄', not_member: `<@${target.id}> không ở trong bang của cậu~` }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply(`👢 Đã đuổi <@${target.id}> khỏi bang.`);
        }

        if (sub === 'disband') {
            const r = await db.clanDisband(me.id);
            if (!r) return interaction.editReply('Ơ, có lỗi, thử lại sau nhé~');
            const msg = { not_in: 'Cậu chưa ở bang nào~', not_leader: 'Chỉ trưởng bang mới giải tán được~' }[r.status];
            if (msg) return interaction.editReply(msg);
            return interaction.editReply(`🏚️ Bang đã giải tán. ${Number(r.refund) > 0 ? `Quỹ còn lại **${fmt(r.refund)}** ${C} đã trả về ví cậu.` : ''}`);
        }

        if (sub === 'list') {
            const clans = await db.clanList(15);
            if (!clans.length) return interaction.editReply('Chưa có bang nào được lập~ Hãy là người đầu tiên với `/clan create`!');
            const lines = clans.map((c, i) => `${['🥇', '🥈', '🥉'][i] || `**${i + 1}.**`} **${c.name}** (Lv.${clanLevel(c.xp)}) — quỹ **${fmt(c.bank)}** ${C} · <@${c.leader_id}>`);
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.COLORS.JACKPOT).setTitle('🏰 Bảng xếp hạng Bang hội').setDescription(lines.join('\n'))] });
        }

        if (sub === 'war') {
            const u = await db.getUser(me.id);
            if (!u?.clan_id) return interaction.editReply('Cậu chưa ở bang nào~');
            const myClan = await db.clanById(u.clan_id);
            if (!myClan || myClan.leader_id !== me.id) return interaction.editReply('Chỉ trưởng bang mới khai chiến được nhé~');
            const cdUntil = warCooldown.get(myClan.id) || 0;
            if (Date.now() < cdUntil) return interaction.editReply(`Bang cậu vừa chinh chiến xong, nghỉ ngơi đã~ Quay lại sau <t:${Math.floor(cdUntil / 1000)}:R>.`);
            const foe = await db.clanByName(interaction.options.getString('clan').trim());
            if (!foe) return interaction.editReply('Không tìm thấy bang đối thủ~');
            if (foe.id === myClan.id) return interaction.editReply('Không thể tự đánh bang mình đâu~ 😅');
            const stake = Math.min(Number(myClan.bank), Number(foe.bank), config.CLAN.WAR_STAKE);
            if (stake <= 0) return interaction.editReply(`Cả hai bang đều cần có quỹ (cược tối đa ${fmt(config.CLAN.WAR_STAKE)} ${C}) mới khai chiến được. Góp quỹ thêm nhé~`);

            const embed = new EmbedBuilder().setColor(config.COLORS.WARNING).setTitle('⚔️ Lời tuyên chiến!')
                .setDescription(`Bang **${myClan.name}** tuyên chiến với bang **${foe.name}**!\nCược: **${fmt(stake)}** ${C} — bang thua mất, bang thắng cướp.\n\n<@${foe.leader_id}> (trưởng bang **${foe.name}**) có chấp nhận không?`);
            const row = (dis = false) => new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('accept').setLabel('Chấp nhận ⚔️').setStyle(ButtonStyle.Danger).setDisabled(dis),
                new ButtonBuilder().setCustomId('decline').setLabel('Từ chối 🏳️').setStyle(ButtonStyle.Secondary).setDisabled(dis));
            const msg = await interaction.editReply({ content: `<@${foe.leader_id}>`, embeds: [embed], components: [row()] });
            const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
            let answered = false;
            collector.on('collect', async (i) => {
                if (i.user.id !== foe.leader_id) return i.reply({ content: 'Chỉ trưởng bang đối thủ mới trả lời được~', flags: MessageFlags.Ephemeral });
                answered = true;
                if (i.customId === 'decline') {
                    await i.update({ embeds: [embed.setColor(config.COLORS.ERROR).setDescription(`Bang **${foe.name}** đã từ chối khai chiến. 🏳️`)], components: [] });
                    return collector.stop('done');
                }
                const [myExps, foeExps] = await Promise.all([db.clanMembersExp(myClan.id), db.clanMembersExp(foe.id)]);
                const pA = clanPower(myExps) * (0.8 + Math.random() * 0.4);
                const pB = clanPower(foeExps) * (0.8 + Math.random() * 0.4);
                const winner = pA >= pB ? myClan : foe;
                const loser = pA >= pB ? foe : myClan;
                const r = await db.clanWar(winner.id, loser.id, stake);
                const taken = r?.taken ?? 0;
                warCooldown.set(myClan.id, Date.now() + 10 * 60000);
                await i.update({ embeds: [new EmbedBuilder().setColor(config.COLORS.JACKPOT).setTitle('⚔️ Kết quả chiến tranh bang')
                    .setDescription(`**${myClan.name}** (sức mạnh ${Math.round(pA)}) ⚔️ **${foe.name}** (sức mạnh ${Math.round(pB)})\n\n🏆 Bang **${winner.name}** chiến thắng, cướp **${fmt(taken)}** ${C} vào quỹ!`)], components: [] });
                collector.stop('done');
            });
            collector.on('end', async () => {
                if (!answered) await interaction.editReply({ embeds: [embed.setColor(config.COLORS.ERROR).setDescription(`Bang **${foe.name}** không trả lời kịp. Khai chiến bị huỷ.`)], components: [] }).catch(() => {});
            });
            return;
        }

        // info
        const name = interaction.options.getString('name');
        let clan;
        if (name) clan = await db.clanByName(name.trim());
        else { const u = await db.getUser(me.id); clan = u?.clan_id ? await db.clanById(u.clan_id) : null; }
        if (!clan) return interaction.editReply(name ? 'Không tìm thấy bang này~' : 'Cậu chưa ở bang nào~ Gõ `/clan list` để xem các bang nhé.');

        const members = await db.clanMembers(clan.id);
        const memList = members.map(id => `${id === clan.leader_id ? '👑' : '▫️'} <@${id}>`).join('\n') || '*(trống)*';
        return interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(config.COLORS.INFO)
            .setTitle(`🏰 Bang: ${clan.name} (Lv.${clanLevel(clan.xp)})`)
            .addFields(
                { name: 'Trưởng bang', value: `<@${clan.leader_id}>`, inline: true },
                { name: 'Quỹ bang', value: `${fmt(clan.bank)} ${C}`, inline: true },
                { name: 'Cổ tức/ngày', value: `${fmt(clanLevel(clan.xp) * 100)} ${C}/thành viên`, inline: true },
                { name: `Thành viên (${members.length})`, value: memList, inline: false },
            )
            .setFooter({ text: 'Góp quỹ (/clan deposit) để bang lên cấp & cổ tức cao hơn~' })] });
    },
};
