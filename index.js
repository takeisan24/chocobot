require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// Tạo Collection để lưu các lệnh (tên lệnh tương ứng với code thực thi)
client.commands = new Collection();

// ---------------------------------------------------------
// 1. COMMAND HANDLER
// ---------------------------------------------------------
const foldersPath = path.join(__dirname, 'src', 'commands');
// Tự tạo folder nếu chưa có
if (!fs.existsSync(foldersPath)) {
    fs.mkdirSync(foldersPath, { recursive: true });
}

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.statSync(commandsPath).isDirectory()) continue;
    
    // Tìm đếm các file mã Javascript .js
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Thiết lập lệnh mới trong Collection
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute" bắt buộc.`);
        }
    }
}

// ---------------------------------------------------------
// 2. EVENT HANDLER
// ---------------------------------------------------------
const eventsPath = path.join(__dirname, 'src', 'events');
if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
}

const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// ---------------------------------------------------------
// 3. SERVER HTTP (GIỮ BOT HOẠT ĐỘNG 24/7 TRÊN RENDER.COM)
// ---------------------------------------------------------
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Tín hiệu mạng bắt được thành công! Discord Bot (Choco) đã sẵn sàng hoạt động 24/7. 🚀');
});

app.listen(port, () => {
    console.log(`[HTTP SERVER] Web server đang chạy ở port ${port}`);
});

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------
// Chú ý: Sử dụng DISCORD_TOKEN từ file .env
client.login(process.env.DISCORD_TOKEN);