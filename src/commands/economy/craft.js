const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');
const RECIPES = require('../../data/recipes');

const fmt = n => Number(n).toLocaleString('vi-VN');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('craft')
        .setDescription('Chế tạo đồ từ nguyên liệu (gỗ/quặng/đá) 🔨')
        .addSubcommand(s => s.setName('list').setDescription('Xem công thức chế tạo'))
        .addSubcommand(s => s.setName('make').setDescription('Chế một món')
            .addStringOption(o => o.setName('recipe').setDescription('Món muốn chế').setRequired(true).setAutocomplete(true))),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        await interaction.respond(RECIPES
            .filter(r => r.name.toLowerCase().includes(focused) || r.id.includes(focused))
            .slice(0, 25).map(r => ({ name: r.name, value: r.id })));
    },

    async execute(interaction) {
        await interaction.deferReply();
        const items = await db.getItems();
        const nameOf = id => items.find(i => i.id === id)?.name || id;
        const priceOf = id => Number(items.find(i => i.id === id)?.price || 0);
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') {
            const lines = RECIPES.map(r => {
                const mats = Object.entries(r.mats).map(([id, q]) => `${q}× ${nameOf(id)}`).join(' + ');
                const costStr = r.cost > 0 ? ` + ${fmt(r.cost)} ${config.CURRENCY} tiền công` : '';
                return `🔨 **${r.name}** — cần ${mats}${costStr}\n   → bán lại **${fmt(Math.floor(priceOf(r.result) * 0.5))}** ${config.CURRENCY}`;
            });
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.COLORS.INFO)
                .setTitle('🔨 Công thức chế tạo')
                .setDescription(`Kiếm **Gỗ** qua \`/chop\`, **Quặng Sắt / Đá** qua \`/mine\` rồi chế nhé~\n\n${lines.join('\n')}`)
                .setFooter({ text: 'Chế: /craft make <món>' })] });
        }

        const id = interaction.options.getString('recipe');
        const recipe = RECIPES.find(r => r.id === id);
        if (!recipe) return interaction.editReply('Không có công thức này~ Gõ `/craft list` để xem nhé.');

        const r = await db.craftItem(interaction.user.id, recipe);
        if (!r) return interaction.editReply('Ơ, có lỗi khi chế tạo, thử lại sau nhé~ 🌸');
        if (r.status === 'poor_money') return interaction.editReply(`Cậu cần **${fmt(recipe.cost)}** ${config.CURRENCY} tiền công mà ví chưa đủ~ 😟`);
        if (r.status === 'poor_mat') return interaction.editReply(`Cậu thiếu nguyên liệu **${nameOf(r.missing)}**~ Đi \`/mine\` \`/chop\` kiếm thêm nhé! ⛏️🪓`);

        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(config.COLORS.SUCCESS)
            .setDescription(`🔨 Chế tạo thành công **${recipe.qty}× ${recipe.name}**! Mang ra \`/sell\` kiếm lời nhé~ 💰`)] });
    },
};
