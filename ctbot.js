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

var giphy_key = "dc6zaTOxFJmzC";
var youtube_key = "AIzaSyAw5MsLU5Nz9rqYTkPib61PJYL49hLvHx8";
var youtube_id = "PLLKyePPBYFXE8wmCJEFC_OalwE-CY9X9z";

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

				func(response.data.image_url);
			} catch (e){
				func(undefined);
			}
		}
	}.bind(this));
}
//Pull a random video from the playlist, and return a link to it
function get_video(arg, func){
	var request = require("request")
	var q = 'https://www.googleapis.com/youtube/v3/playlistItems?key='+youtube_key+"&part=contentDetails&maxResults=50&playlistId="+youtube_id;
	console.log("requesting youtube data "+ q);
	request(q,function(error,response,body){
		if (error || response.statusCode !== 200) {
			console.error("video: Got error: " + body);
			console.log(error);
		}
		else {
			try{
				var response = JSON.parse(body);
				var length = response.pageInfo.totalResults;
				var num = Math.floor(Math.random()*(length)+1)-1;
				console.log("Found "+length+" videos, getting video "+num);
				if(num<50){
					func("https://www.youtube.com/watch?v="+response.items[num].contentDetails.videoId);
				} else {
					get_youtube([num-50, response.nextPageToken], function(url){
						func(url);
					});
				}
			} catch (e){
				func(undefined);
			}
		}
	}.bind(this));
}
//continue get_video by recursively searching through the playlist pages
function get_youtube(args, func){
	var request = require("request");
	var num = args[0];
	var next_page = args[1];
	var q = 'https://www.googleapis.com/youtube/v3/playlistItems?key='+youtube_key+"&part=contentDetails&maxResults=50&playlistId="+youtube_id;
	q+="&pageToken="+next_page;
	console.log("requesting youtube data "+ q);
	request(q,function(error,response,body){
		if (error || response.statusCode !== 200) {
			console.error("youtube: Got error: " + body);
			console.log(error);
		}
		else {
			try{
				var response = JSON.parse(body);
				if(num<50){
					func("https://www.youtube.com/watch?v="+response.items[num].contentDetails.videoId);
				} else {
					get_youtube([num-50, response.nextPageToken], function(url){
						func(url);
					});
				}
			} catch (e){
				func(undefined);
			}
		}
	}.bind(this));
}


//Todo: move old commands over to new parsing
bot.on('message', msg => {
	//List of commands. Make sure to update
	if(msg.content == '!commands'){
		msg.channel.sendMessage('Available Commands:');
		msg.channel.sendMessage('!ping : check if bot is alive');
		msg.channel.sendMessage('!img : send test image');
		msg.channel.sendMessage('!gif [tag1 tag2 ...] : random gif from the tags. if given no arguments, finds random gif');
		msg.channel.sendMessage('!video : random video from playlist');
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
	}

	if(msg.content == '!video') {
		get_video("", function(url){
			if (url !== undefined)
				msg.channel.sendMessage(url);
			else
				msg.channel.sendMessage("Error retrieving video. Sorry!");
		});
	}

	if(msg.content[0] == '!'){
		var command = msg.content.split(" ")[0].substring(1); //Gets the command name, minus the '!'
		var args = msg.content.substring(command.length+2).split(" "); //2 because ! and ' '
		
		if (command == 'gif'){
			get_gif(args, function(url){
				if (url !== undefined)
					msg.channel.sendMessage(url);
				else
					msg.channel.sendMessage("Error retrieving gif. Sorry!");
			});
		}
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