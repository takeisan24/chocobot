const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');
const COMMON = ['banh_mi', 'ca_phe', 'xoi', 'nuoc_tang_luc'];
const GOOD = ['the_sinh_vien', 'mu_bao_hiem', 'dieu_cay', 'bo_do_sua_xe'];
const RARE = ['rolex', 'xe_wave', 'laptop'];
const rpick = a => a[Math.floor(Math.random() * a.length)];

module.exports = {
    data: new SlashCommandBuilder().setName('crate').setDescription('Mở rương bí ẩn 🎁'),
    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const cost = config.CRATE.COST;
        if (!await db.addMoney(userId, -cost, 'wallet')) {
            return interaction.editReply(`Cần **${fmt(cost)}** ${config.CURRENCY} để mở rương~ 😟`);
        }

        const money = mult => { const amt = Math.floor(cost * mult); db.addMoney(userId, amt, 'wallet'); return amt; };
        const giveItem = async pool => { const id = rpick(pool); await db.giveItemAdmin(userId, id, 1); const it = await db.getItem(id); return it ? it.name : id; };

        // Phân phối EV ÂM (~0.7x) -> rương là money sink thật, spam mở sẽ lỗ dần.
        const r = Math.random();
        let desc, color = config.COLORS.SUCCESS;
        if (r < 0.40) { const a = money(0.1 + Math.random() * 0.3); desc = `💵 Chút tiền lẻ: **+${fmt(a)}** ${config.CURRENCY}`; color = config.COLORS.WARNING; }
        else if (r < 0.65) { const a = money(0.5 + Math.random() * 0.4); desc = `💰 Cũng được! **+${fmt(a)}** ${config.CURRENCY}`; color = config.COLORS.WARNING; }
        else if (r < 0.80) { desc = `📦 Vật phẩm: **${await giveItem(COMMON)}**!`; }
        else if (r < 0.92) { const a = money(1 + Math.random() * 0.8); desc = `💰💰 Khá đó! **+${fmt(a)}** ${config.CURRENCY}`; }
        else if (r < 0.975) { desc = `🎁 Vật phẩm xịn: **${await giveItem(GOOD)}**!`; }
        else if (r < 0.997) { const a = money(2.5 + Math.random() * 1.5); desc = `🤑 ĐẠI TRÚNG: **+${fmt(a)}** ${config.CURRENCY}!!!`; color = config.COLORS.JACKPOT; }
        else { desc = `💎 CỰC HIẾM! Cậu nhận được **${await giveItem(RARE)}**!`; color = config.COLORS.JACKPOT; }

        const u = await db.getUser(userId);
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setColor(color).setTitle('🎁 Mở Rương Bí Ẩn')
            .setDescription(`Cậu chi **${fmt(cost)}** ${config.CURRENCY} mở rương...\n\n${desc}\n\n💵 Số dư ví: **${fmt(u?.wallet || 0)}** ${config.CURRENCY}`)] });
    },
};
