const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Không tìm thấy lệnh nào khớp với ${interaction.commandName}.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Lỗi khi thực thi lệnh ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true });
            }
        }
    },
};
