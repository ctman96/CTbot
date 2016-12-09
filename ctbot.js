const Discord = require("discord.js")
const bot = new Discord.Client();

bot.on('ready', () => {
	console.log('Logged in as ${client.user.username}#${client.user.discriminator}');
});

bot.on('message', msg => {
	if (msg.content === 'ping') msg.reply('Pong!');
});

bot.login('MjU2NTgzMjE3ODc4OTI1MzIz.CyuSxQ.bGD7hsyHjV5LaVVqCPlHmVnec0o');