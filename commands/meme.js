module.exports = {
    name: "meme",
    description: "Animemes subreddit",
    async execute(message, args) {
        const api = require('imageapi.js');
        const Discord = require('discord.js')


        let subreddits = [
            'goodanimemes',
            'Animemes'
        ];
        let subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    
        let img = await api(subreddit);
    
        const Embed = new Discord.MessageEmbed()
        .setTitle(`Anime memes`)
        .setURL(`https://reddit.com/r/Animemes`)
        .setImage(img)
    
        message.channel.send(Embed);
    }
}