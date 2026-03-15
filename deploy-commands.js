require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'src', 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.statSync(commandsPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`[WARNING] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute" bắt buộc.`);
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Bắt đầu làm mới ${commands.length} application (/) commands.`);

        // Trích xuất CLIENT_ID từ TOKEN nếu chưa cài trong .env
        let clientId = process.env.CLIENT_ID;
        if (!clientId) {
            try {
                // Tự động phân tích ID từ JWT token đầu tiên
                clientId = Buffer.from(process.env.DISCORD_TOKEN.split('.')[0], 'base64').toString('utf-8');
            } catch (e) {
                console.error("Không thể tự động trích xuất CLIENT_ID từ token. Vui lòng thêm CLIENT_ID vào file .env.");
                return;
            }
        }

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log(`Đã làm mới thành công ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
