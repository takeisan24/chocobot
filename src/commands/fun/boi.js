const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

const TINH_DUYEN = [
    'Hôm nay có người thầm để ý cậu đó~ 👀',
    'Tình duyên khởi sắc, mạnh dạn nhắn tin trước đi!',
    'Nên dành thời gian cho người ấy nhiều hơn nhé.',
    'Độc thân vui vẻ cũng tốt mà, đừng vội~',
    'Cẩn thận hiểu lầm nhỏ, nói chuyện thẳng thắn nha.',
];
const TAI_LOC = [
    'Tài lộc dồi dào, hợp đi /work hôm nay! 💰',
    'Có khoản thu bất ngờ đang chờ cậu đó.',
    'Chi tiêu hợp lý kẻo cuối tháng "viêm màng túi" nha~',
    'Hôm nay đỏ bạc lắm, thử /baucua một ván nhẹ? 😉',
    'Giữ tiền trong /deposit cho an toàn nhé.',
];
const MAY_MAN = ['⭐⭐⭐⭐⭐ Cực đỉnh!', '⭐⭐⭐⭐ Rất tốt', '⭐⭐⭐ Ổn áp', '⭐⭐ Tàm tạm', '⭐ Cẩn thận chút nha'];
const LOI_KHUYEN = [
    'Cười nhiều một chút, mọi việc sẽ suôn sẻ hơn~ 🌸',
    'Uống đủ nước và nghỉ ngơi nhé, sức khỏe là vàng!',
    'Hôm nay hợp làm việc tốt — giúp đỡ ai đó xem sao.',
    'Đừng so sánh mình với người khác, cậu giỏi theo cách riêng mà!',
    'Một lời cảm ơn nhỏ hôm nay sẽ mang lại may mắn lớn.',
];

// Bói theo NGÀY + người (cùng ngày ra cùng kết quả)
function seed(userId) {
    const s = userId + new Date().toISOString().slice(0, 10);
    let h = 0;
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
}
const pick = (arr, n) => arr[n % arr.length];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boi')
        .setDescription('Waguri xem bói cho cậu hôm nay 🔮'),
    async execute(interaction) {
        await interaction.deferReply();
        const h = seed(interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(config.COLORS.JACKPOT)
            .setTitle(`🔮 Vận mệnh hôm nay của ${interaction.user.username}`)
            .addFields(
                { name: '💕 Tình duyên', value: pick(TINH_DUYEN, h), inline: false },
                { name: '💰 Tài lộc', value: pick(TAI_LOC, h >> 3), inline: false },
                { name: '🍀 May mắn', value: pick(MAY_MAN, h >> 6), inline: false },
                { name: '🌸 Lời khuyên của Waguri', value: pick(LOI_KHUYEN, h >> 9), inline: false },
            )
            .setFooter({ text: 'Bói cho vui thôi nha~ Quay lại mai để xem tiếp!' });
        await interaction.editReply({ embeds: [embed] });
    },
};
