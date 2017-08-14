const Discord = require("discord.js")
const bot = new Discord.Client();
const express = require('express')
const app = express()
const ytdl = require('ytdl-core')


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

const giphy_key = "dc6zaTOxFJmzC";
const youtube_key = AuthDetails.YOUTUBE_KEY;
const youtube_id = "PLLKyePPBYFXE8wmCJEFC_OalwE-CY9X9z";
var ytlength = 0;
const streamOptions={seek: 0, volume: 1};
var connections = [];

bot.on('ready', () => {
	console.log('Logged in successfully');
	youtube_length(undefined, function(n){
		ytlength = n;
		console.log("Found "+ytlength+' videos');
	});
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

function youtube_length(req,resp){
	console.log("Getting playlist size");
	var request = require("request");
	var q = 'https://www.googleapis.com/youtube/v3/playlistItems?key='+youtube_key+"&part=contentDetails&maxResults=50&playlistId="+youtube_id;
	console.log("Sending request: "+ q);
	request(q,function(error,response,body){
		if (error || response.statusCode !== 200) {
			console.error("youtube: Got error: " + body);
			console.log(error);
		}
		else {
			try{
				var response = JSON.parse(body);
				var length = response.pageInfo.totalResults;
				resp(length);
			}
			catch (e){
				resp(undefined)
			}
		}
	}.bind(this));
}

//pull a random youtube video by recursively searching through the playlist pages
function get_youtube(args, func){
	var request = require("request");
	var num = args[0];
	var next_page = args[1];
	var q = 'https://www.googleapis.com/youtube/v3/playlistItems?key='+youtube_key+"&part=contentDetails&maxResults=50&playlistId="+youtube_id;
	if(next_page !== undefined){
		q+="&pageToken="+next_page;
	}
	console.log("Sending request: "+ q);
	request(q,function(error,response,body){
		if (error || response.statusCode !== 200) {
			console.error("youtube: Got error: " + body);
			console.log(error);
		}
		else {
			try{
				var response = JSON.parse(body);
				var length = response.pageInfo.totalResults;
				if (num == undefined){
					num = Math.floor(Math.random()*(length)+1)-1;
					console.log("Found "+length+" videos. Getting video #"+num);
				}
				if(num<50){
					func("https://www.youtube.com/watch?v="+response.items[num].contentDetails.videoId);
				} else {
					console.log("Continuing to next page...");
					get_youtube([num-50, response.nextPageToken], function(url){
						func(url);
					});
				}
			} catch (e){
				console.log(e);
				func(undefined);
			}
		}
	}.bind(this));
}

function isNormalInteger(str) {
    var n = ~~Number(str);
    return String(n) === str && n >= 0;
}

//Todo: move old commands over to new parsing
bot.on('message', msg => {
	//List of commands. Make sure to update
	if(msg.content == '!commands'){
		var commands = ('Available Commands:'
		+'\n!ping : check if bot is alive'
		+'\n!img : send test image'
		+'\n!gif [tag1 tag2 ...] : random gif from the tags. if given no arguments, finds random gif'
		+'\n!video [0-'+(ytlength-1)+'] : video from playlist. no arguments provides a random video'
		+'\n!voice [join/kick] [channel] : joins/kicks from the voice channel'
		+'\n!voice [play] [youtube url] : plays the audio into the voice channel'
		+'\n!roll [number of dice]d[type of die] : rolls dice and sends the result. ex: 2d20 rolls 2 d20 dice');
		msg.channel.sendMessage(commands);
	}

	if (msg.content === '!ping') msg.reply('Pong!');

	if(msg.content == '!img') msg.channel.sendFile('https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Video-Game-Controller-Icon-IDV-edit.svg/2000px-Video-Game-Controller-Icon-IDV-edit.svg.png');

	if(msg.content[0] == '!'){
		console.log('==================');
		console.log("Command received: "+msg);
		if(msg.author.id != bot.user.id){
			var command = msg.content.split(" ")[0].substring(1); //Gets the command name, minus the '!'
			var args = msg.content.substring(command.length+2).split(" "); //2 because ! and ' '
			
			if (command == 'gif'){
				get_gif(args, function(url){
					if (url !== undefined){
						msg.channel.sendMessage(url);
						console.log("Successfully retrieved gif:"+url);
					}
					else{
						msg.channel.sendMessage("Error retrieving gif. Sorry!");
						console.log("Error retrieving gif, returned undefined");
					}
				});
				console.log('==================');
			}

			if(command == 'voice'){
				try{
					var channel = bot.channels.find('name', args[1]);
					console.log('channel = '+channel);

					if (args[0] == 'join'){
						try{
							//TODO: ffmpeg buildpack?
							channel.join(args[1])
							.then(connection => {
								console.log("Joined voice channel "+channel.name);
								connections[0] = connection;
							})
							.catch(console.error);
							
						}
						catch(e){
							console.log(e);
							msg.channel.sendMessage("Error joining voice channel, sorry");
						}
					}
					else if (args[0] == 'kick'){
						console.log('Attempting to disconnect from '+channel);
						channel.leave();
						//Todo: remove connection
					}
					else if (args[0] == 'play'){
						try{
							const stream = ytdl(args[1], {filter: 'audioonly'});
							const dispatcher = connections[0].playStream(stream, streamOptions);
							console.log('Successfly retrieved and played stream');
						}
						catch(e){
							console.log(e);
						}
					}
				}
				catch(e){
					console.log(e);
					msg.channel.sendMessage("Error accessing channel "+ args[1]);
				}
				
			}

			if(command == 'video') {
				var num = undefined;
				if (isNormalInteger(args[0])){
					num = Number(args[0]);
					if (num > ytlength-1 || num < 0){
						console.log('invalid number');
						num = undefined;
						msg.channel.sendMessage('invalid video number. use 0-'+(ytlength-1)+'. Here\'s a random video')
					}
					else{
						console.log('Requesting video '+num);
					}
				}else{
					console.log('Requesting random video');
				}
				get_youtube([num,undefined], function(url){
					if (url !== undefined){
						msg.channel.sendMessage(url);
						console.log("Successfully retrieved video:"+url);
					}
					else{
						msg.channel.sendMessage("Error retrieving video. Sorry!");
						console.log("Error retrieving video, returned undefined");
					}
				});
				console.log('==================');
			}

			if(command == 'roll') {
				//TODO: Add suport for subtraction or negative modifiers
				var dice = args[0].split('+');
				var count = 0;
				var result = 0;
				for(var c = 0; c < dice.length; c++) {
                    //Check if its just a modifier
                    if (isNormalInteger(dice[c])) {
                        result = result + Number(dice[c]); //Add modifier to result
                    }
                    else {
                        //Else treat as a die

                        var i = 0;
                        //Parse the number of dice
                        while (isNormalInteger(dice[c].charAt(i))) {
                            i++;
                        }
                        var num = Number(dice[c].substring(0, i)); //Pull out the number of dice to roll
                        var die = dice[c].substring(i); //Pull out the die info
                        if (die.charAt(0) == 'd' || die.charAt(0) == 'D') {
                            die = die.substring(1); //remove the d
                            if (isNormalInteger(die)) {
                                die = Number(die);
                                var roll = 0;
                                for (var loop = 0; loop < num; loop++) {
                                    roll = roll + Math.round(Math.random() * die) % die + 1;
                                }
                                result = result + roll;
                            }
                            else {
                            }
                        }
                        else {
                        }
                    }
                }
                msg.channel.sendMessage("Result: "+result);
			}
		}
	}
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