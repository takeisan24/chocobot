const { Events, ActivityType } = require('discord.js');

// Persona Waguri: tiểu thư tiệm bánh hiền lành, dịu dàng, hay động viên ✨
const STATUSES = [
    { name: 'mọi người chăm chỉ làm việc ✨', type: ActivityType.Watching },
    { name: 'cùng mọi người làm giàu 🍡', type: ActivityType.Playing },
    { name: 'tiếng leng keng của tiền xu 🪙', type: ActivityType.Listening },
    { name: 'tiệm bánh nhà Waguri 🍰', type: ActivityType.Watching },
    { name: 'ai chăm chỉ nhất nào~ 🌸', type: ActivityType.Competing },
    { name: 'cố lên nhé mọi người 💪', type: ActivityType.Watching },
];

const ROTATE_MS = 30_000; // đổi status mỗi 30 giây (an toàn rate-limit)

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        let i = 0;
        const rotate = () => {
            const s = STATUSES[i % STATUSES.length];
            client.user.setActivity(s.name, { type: s.type });
            i++;
        };

        rotate(); // đặt ngay status đầu tiên
        setInterval(rotate, ROTATE_MS);
    },
};
