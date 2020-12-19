const { executionAsyncResource } = require('async_hooks');
const fs = require('fs');
const Discord = require('discord.js');
const api = require('imageapi.js');
const ytdl = require('ytdl-core');
const { YTSearcher } = require('ytsearcher');
const { stringify } = require('querystring');


const client = new Discord.Client();

client.commands = new Discord.Collection();

const searcher = new YTSearcher({
    key: process.env.youtube_api,
    revealed: true
});

const prefix = '!';
const queue = new Map();

const token = process.env.token;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
 
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('online');
});

client.on('message', async message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    var diceNum = ['1', '2', '3', '4', '5', '6'];
    var dice = Math.floor(Math.random() * 6);

    const serverQueue = queue.get(message.guild.id);

    const timeTaken = Date.now() - message.createdTimestamp;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if(command === 'embed'){
        client.commands.get('embed').execute(message);
    }
    if(command === 'rolladice') {
        message.channel.send(diceNum[dice]);
    }
    if(command === 'meme') {
        client.commands.get('meme').execute(message, args);
    }

    switch(command){
        case 'play':
            execute(message, serverQueue);
            break;
        case 'stop':
            stop(message, serverQueue);
            break;
        case 'skip':
            skip(message, serverQueue);
            break;
        case 'join':
            join(message, args);
            break;
        case 'leave':
            leave(message, args);
            break;

    }
 
    async function execute(message, serverQueue){
        let vc = message.member.voice.channel;
        if(!vc){
            return message.channel.send("Please join a voice chat first");
        }else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            const songInfo = await ytdl.getInfo(result.first.url)
 
            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                channel: songInfo.videoDetails.author|stringify,
                duration: songInfo.videoDetails.lengthSeconds,
                thumbnail: songInfo.videoDetails.videoThumbnail
            };
 
            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };
                queue.set(message.guild.id, queueConstructor);
 
                queueConstructor.songs.push(song);
 
                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                    message.channel.send(`***${timeTaken}ms***`)
                }catch (err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`Unable to join the voice chat ${err}`)
                }
            }else{
                serverQueue.songs.push(song);
                return message.channel.send({embed: {
                    color: 3447003,
                    author: {
                        name: "Added to queue!",
                        icon_url: message.author.avatarURL()
                    },
                    title: `${song.title}`,
                    url: `${song.url}`,
                    thumbnail: `${song.thumbnail}`,
                    fields: [{
                        name: "Channel",
                        value: `${song.channel}`
                    },
                    {
                        name: "Song duration",
                        value: `${song.duration}`
                    }
                    ],
                    footer: {
                        text: `${timeTaken}ms`,
                        icon: message.author.avatarURL
                    }
                }});
            }
        }
    }
    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () =>{
                serverQueue.songs.shift();
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`Now Playing - ${serverQueue.songs[0].title}... (*${timeTaken}ms*)`);
        
    }
    function stop (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("You need to join the voice chat first!")
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }
    function skip (message, serverQueue){
        if(!message.member.voice.channel)
            return message.channel.send("You need to join the voice chat first");
        if(!serverQueue)
            return message.channel.send("There is nothing to skip!");
        serverQueue.connection.dispatcher.end();
    }

    function join(message, args) {
        if (message.member.voice.channel) {
            message.member.voice.channel.join()
            message.channel.send(`${timeTaken}ms`)
          } else {
            message.channel.send(`Join the channel first bruh. (${timeTaken}ms)`);
          }
    }

    function leave(message, args) {

        if(message.guild.voice.channel){
            message.guild.voice.channel.leave()
            message.channel.send(`${timeTaken}ms`)
        }else {
            message.channel.send(`I'm not in a voice channel, dude. (${timeTaken}ms)`)
        }
    }

    if (command === "ping") {
        
        message.channel.send(`${timeTaken}ms`);
    }
})


client.login(token);