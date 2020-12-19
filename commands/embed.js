module.exports = {
	name: 'embed',
	description: 'test embed',
	execute(message) {
		message.channel.send({embed: {
            color: 3447003,
            description: "A very simple Embed!"
          }});
	},
};