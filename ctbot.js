const Discord = require("discord.js")
const bot = new Discord.Client();
const express = require('express')
const app = express()


// Get authentication details
try {
	var AuthDetails = require("./config.json");
} catch (e){
	console.log("Could not find config.json, checking for process.env");
	try{
		var AuthDetails = process.env;
	} catch (e){
		console.log("Could not find process.env, exiting")
		process.exit();
	}
	console.log("Successfully retrieved process.env")
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



app.set('port', (AuthDetails.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response){
	response.send('Pong')
})

app.listen(app.get('port'), function() {
	console.log("Running at localhost:"+app.get('port'))
})