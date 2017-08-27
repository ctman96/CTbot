const Discord = require("discord.js")
const bot = new Discord.Client();
const express = require('express')
const app = express()
const ytdl = require('ytdl-core')
const Dice = require('node-dice-js');
const fs = require('fs');
const drawing = require('pngjs-draw');
const png = drawing(require('pngjs').PNG)

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

//Setup Folders
if (!fs.existsSync('./img')){
    fs.mkdirSync('./img');
}
if (!fs.existsSync('./img/out')){
    fs.mkdirSync('./img/out');
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
bot.user.setGame('Testing');
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

function drawDice(args, func) {
	var type = args[0];
	var value = args[1];
	var num = args[2];
	var xpos = 10;
	var ypos = 10;
	if (value.toString().length > 1){
	    xpos =  xpos-(value.toString().length+1)
    }

    if ([4,6,8,10,12,20].includes(type)) {
        var outputPath = './img/out/d' + type + 'out' + num + '.png';

        fs.createReadStream("./img/d" + type + ".png")
            .pipe(new png())
            .on('parsed', function () {
                this.drawText(xpos, ypos, value, this.colors.white(255))
                this.pack().pipe(fs.createWriteStream(outputPath)
                    .on('finish', function () {
                        func(outputPath);
                    }))
            })
    }
    else if (type == 'advantage'){
        var outputPath = './img/out/d' + type + 'out' + num + '.png';
        fs.createReadStream("./img/d8.png")
            .pipe(new png())
            .on('parsed', function () {
                if (value >= 5)
                    this.drawText(10, 10, 'O', this.colors.white(255))
                this.pack().pipe(fs.createWriteStream(outputPath)
                    .on('finish', function () {
                        func(outputPath);
                    }))
            })
    }
    else if (type == 'challenge'){
        var outputPath = './img/out/d' + type + 'out' + num + '.png';
        fs.createReadStream("./img/d10.png")
            .pipe(new png())
            .on('parsed', function () {
                if (value >= 5)
                    this.drawText(10, 10, 'X', this.colors.white(255))
                this.pack().pipe(fs.createWriteStream(outputPath)
                    .on('finish', function () {
                        func(outputPath);
                    }))
            })

    }
    else{
    	console.log(type+' is not a compatible type of die to draw')
        func(undefined);
	}
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
            //Go through each of the requested rolls
            for(var i = 0; i < args.length; i++){
                var dice = new Dice();

                var pattAdv = /^\d*\d*(adv|advantage)$/ig;
                var pattChal = /^\d*\d*(chal|challenge)$/ig;
                //Check for special dice, execute the roll and set the type
                if(pattAdv.test(args[i])){
                    var num = args[i].match(/\d+/); //Pull the number from the start
                    if (num == undefined) {
                        num = 1;
                    }else if (num.length > 1){
                        num = num[0];
                    }
                    console.log('Executing '+num+' advantage roll(s)');
                    var result = dice.execute(num+'d8');
                    console.log(result);
                    var type = 'advantage';
                }
                else if (pattChal.test(args[i])){
                    var num = args[i].match(/\d+/); //Pull the number from the start
                    if (num == undefined) {
                        num = 1;
                    }else if (num.length > 1){
                        num = num[0];
                    }
                    console.log('Executing '+num+' challenge roll(s)');
                    var result = dice.execute(num+'d10');
                    console.log(result);
                    var type = 'challenge'
                }
                else {
                    var result = dice.execute(args[i]);
                    console.log(result);
                    var type = result.parsed.faces;
                }

                //Draw the outcomes onto dice, if applicable.
                var outcomes = result.outcomes[0].rolls;
                for (var j = 0; j < outcomes.length; j++) {
                    var outcome = outcomes[j].toString();
                    if (type == 100){
                        var outstring = outcome.toString();
                        var tens = outcome.substring(0,outstring.length-1)+'0';
                        var ones = outcome.substring(outstring.length-1, outstring.length);
                        console.log('outcome: '+outstring+', tens: '+tens+', ones: '+ones);
                        if (tens == '0')
                            tens = '00';
                        if (outstring == '100') {
                            tens = '00';
                            ones = '0';
                        }
                        drawDice([10,tens,j+100], function(dOut){ //uhh, it works
                            if (dOut !== undefined) {
                                msg.channel.sendFile(dOut)
                                    .then(function(message){
                                        fs.unlink(dOut);
                                    });
                            }
                        })
                        drawDice([10,ones,j], function(dOut){
                            if (dOut !== undefined) {
                                msg.channel.sendFile(dOut)
                                    .then(function(message){
                                        fs.unlink(dOut);
                                    });
                            }
                        })


					}
					else {
                        drawDice([type, outcome, j], function (dOut) {
                            if (dOut !== undefined) {
                                msg.channel.sendFile(dOut)
                                    .then(function(message){
                                        fs.unlink(dOut);
                                    });
                            }
                        })
                    }
                }
                //Send the result out
                msg.channel.sendMessage(result.text);
            }
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