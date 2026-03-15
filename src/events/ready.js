const { Events, ActivityType } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        
        // Thiết lập trạng thái (Activity / Profile) cho bot
        client.user.setActivity('quản lý Choco Server 🍫', { type: ActivityType.Watching });
        // Hoặc có thể thử:
        // client.user.setActivity('nhạc', { type: ActivityType.Listening });
        // client.user.setActivity('với các lệnh', { type: ActivityType.Playing });
    },
};
