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

var giphy_key = "dc6zaTOxFJmzC"

bot.on('ready', () => {
	console.log('Logged in successfully');
});

function get_gif(tags, func){
	var request = require("request")
	var q = 'http://api.giphy.com/v1/gifs/random?'+ 'api_key='+giphy_key;
	if (tags !== null){
		q += "&tag=" + tags.join('+');
	}
	request(q, function(error, response, body){
		if (error || response.statusCode !== 200) {
			console.error("gify: Got error: " + body);
			console.log(error);
		}
		else {
			try{
				var response = JSON.parse(body);
				func(responseObj.data.image_url);
			} catch (e){
				func(undefined);
			}
		}
	}.bind(this));
}

bot.on('message', msg => {
	//List of commands. Make sure to update
	if(msg.content == '!commands'){
		msg.channel.sendMessage('Available Commands:');
		msg.channel.sendMessage('!ping : check if bot is alive');
		msg.channel.sendMessage('!img : send test image');
		msg.channel.sendMessage('!doge : random doge. giphy test function using fixed tags');
	}

	if (msg.content === '!ping') msg.reply('Pong!');

	if(msg.content == '!img') msg.channel.sendFile('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Video-Game-Controller-Icon-IDV-edit.svg/2000px-Video-Game-Controller-Icon-IDV-edit.svg.png');

	if(msg.content == '!doge') {
		get_gif(["doge","pupper"], function(url){
			if (url !== undefined)
				msg.channel.sendMessage(url);
			else
				msg.channel.sendMessage("Error retrieving gif. Sorry!");
		});
	};



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