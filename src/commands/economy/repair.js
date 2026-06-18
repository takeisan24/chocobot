const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');
const config = require('../../config');

const fmt = n => Number(n).toLocaleString('vi-VN');

const REPAIR_COSTS = {
    can_cau: 150,
    riu_sat: 225,
    cuoc_sat: 225,
};

const TOOL_NAMES = {
    can_cau: 'Cần câu cá 🎣',
    riu_sat: 'Rìu sắt 🪓',
    cuoc_sat: 'Cuốc sắt ⛏️',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repair')
        .setDescription('Sửa chữa công cụ khai thác (chi phí 15% giá mua)')
        .addStringOption(o => o.setName('tool').setDescription('Chọn công cụ muốn sửa').setRequired(true)
            .addChoices(
                { name: 'Cần câu cá 🎣 (150 VNĐ)', value: 'can_cau' },
                { name: 'Rìu sắt 🪓 (225 VNĐ)', value: 'riu_sat' },
                { name: 'Cuốc sắt ⛏️ (225 VNĐ)', value: 'cuoc_sat' }
            )),

    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const toolId = interaction.options.getString('tool');
        const cost = REPAIR_COSTS[toolId];

        const r = await db.repairTool(userId, toolId, cost);

        if (r === 'no_tool') {
            return interaction.editReply(`🌸 Cậu chưa sở hữu **${TOOL_NAMES[toolId]}** trong kho đồ để sửa. Hãy ghé \`/shop\` mua nhé!`);
        }
        if (r === 'already_repaired') {
            return interaction.editReply(`🌸 **${TOOL_NAMES[toolId]}** vẫn còn rất mới, độ bền 100% rồi không cần sửa đâu~`);
        }
        if (r === 'insufficient_funds') {
            return interaction.editReply(`🌸 Cậu không đủ **${fmt(cost)}** ${config.CURRENCY} trong ví để thanh toán chi phí sửa chữa.`);
        }
        if (r !== 'ok') {
            return interaction.editReply('🌸 Ơ, có lỗi khi sửa công cụ rồi, thử lại sau nhé~');
        }

        const u = await db.getUser(userId);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.SUCCESS)
            .setTitle('🛠️ Sửa chữa công cụ thành công')
            .setDescription(`Cậu đã thanh toán **${fmt(cost)}** ${config.CURRENCY} để phục hồi độ bền của **${TOOL_NAMES[toolId]}** về **100/100**! ✨`)
            .addFields(
                { name: '💵 Số dư ví', value: `**${fmt(u?.wallet || 0)}** ${config.CURRENCY}`, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};
