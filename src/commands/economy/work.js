const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Làm việc để kiếm tiền'),
    async execute(interaction) {
        // Hoãn lại reply để có thời gian xử lý database chờ API
        await interaction.deferReply();

        const userId = interaction.user.id;
        
        // 1. Kiểm tra Cooldown (Ví dụ: 5 phút làm việc một lần)
        const cooldownTime = await db.checkCooldown(userId, 'work');
        if (cooldownTime) {
            const remainingTimeSeconds = Math.floor((cooldownTime - Date.now()) / 1000);
            return await interaction.editReply(`Mới làm xong mệt quá bạn ơi 💦. Hãy quay lại sau <t:${Math.floor(cooldownTime / 1000)}:R> nữa nhé!`);
        }

        try {
            // 2. Lấy hoặc tạo dữ liệu người dùng
            const user = await db.getUser(userId);
            if (!user) {
                return await interaction.editReply('Lỗi hệ thống: Không thể kết nối với Thuế. Vui lòng thử lại sau!');
            }

            let minWage = 10;
            let maxWage = 50;
            let jobName = "Làm thuê tự do ngoài đường";
            let riskRate = 0.05;

            // Truy vấn thông tin công việc nếu user có job_id
            if (user.job_id) {
                const { data: job, error } = await db.supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', user.job_id)
                    .single();

                if (job) {
                    minWage = job.min_wage;
                    maxWage = job.max_wage;
                    jobName = job.name;
                    riskRate = job.risk_rate;
                }
            }

            // 3. Xử lý rủi ro (Risk event)
            const isUnlucky = Math.random() < riskRate;
            let earnedMoney = 0;
            let resultMessage = "";

            if (isUnlucky) {
                // Rủi ro xảy ra: Bị phạt một khoản nhỏ hoặc làm không công
                earnedMoney = -Math.floor(Math.random() * (minWage / 2)); 
                // Trừ tiền
                await db.addMoney(userId, earnedMoney, 'wallet');
                resultMessage = `⚠️ Xui xẻo! Hôm nay đi làm **${jobName}** bạn vướng phải rắc rối và bị mất **${Math.abs(earnedMoney)}** VNĐ.`;
            } else {
                // Thuận lợi: Kiếm tiền ngẫu nhiên từ min đến max
                earnedMoney = Math.floor(Math.random() * (maxWage - minWage + 1)) + minWage;
                await db.addMoney(userId, earnedMoney, 'wallet');
                resultMessage = `✅ Xuất sắc! Bạn cày cuốc **${jobName}** và kiếm được **${earnedMoney}** VNĐ vào ví!`;
            }

            // 4. Cộng thêm một ít kinh nghiệm
            const gainedExp = Math.floor(Math.random() * 5) + 1; // 1 đến 5 exp
            await db.updateExp(userId, gainedExp);

            // 5. Set Cooldown 5 phút
            await db.setCooldown(userId, 'work', 5);

            // Gửi Embed thông báo
            const resultEmbed = new EmbedBuilder()
                .setColor(isUnlucky ? 0xFF0000 : 0x00FF00)
                .setTitle('💼 Kết quả làm việc')
                .setDescription(resultMessage)
                .addFields(
                    { name: 'Kinh nghiệm nhận được', value: `+${gainedExp} EXP`, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [resultEmbed] });

        } catch (error) {
            console.error('[WORK COMMAND ERROR]', error);
            await interaction.editReply('Đã xảy ra lỗi hệ thống nghiêm trọng khi xử lý lệnh làm việc.');
        }
    },
};
