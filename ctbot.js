const Discord = require("discord.js")
const bot = new Discord.Client();

// Get authentication details
try {
	var AuthDetails = require("./config.json");
} catch (e){
	console.log("Could not find config.json, checking for config vars...");
	try{
		var AuthDetails = process.env;
	} catch (e){
		console.log("Could not find config-vars, exiting")
		process.exit();
	}
}

bot.on('ready', () => {
	console.log('Logged in successfully');
});

bot.on('message', msg => {
	if (msg.content === 'ping') msg.reply('Pong!');

	if(msg.content == '!commands') msg.reply('No current commands');

	if(msg.content == '!img') bot.sendFile()
});

bot.login(AuthDetails.TOKEN);