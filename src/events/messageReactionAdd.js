const { MessageEmbed } = require('discord.js')
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, bot) {
        if (user.bot) return;

        const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .catch(err => {
                console.log(err);
            });
        if (!client) return;

        var message = reaction.message;
        var col = await client.db('options').collection('requestChannel').findOne({ k: message.guildId })
            .catch(err => {
                console.error(err);
            });
        if (!col) return;

        let guild = bot.guilds.cache.get(col.k);
        let requestChannel = guild.channels.cache.get(col.v);
        if (message.channel != requestChannel) return;

        var emoji = reaction.emoji.name;
        var receivedEmbed = message.embeds[0];
        var responseEmbed = new MessageEmbed(receivedEmbed);
        var authorId = receivedEmbed.author.name.split('/')[1];
        var requestAuthor;
        try {
            requestAuthor = await guild.members.fetch(authorId);
        } catch(err) {
            console.log('old request embed');
        }

        if (requestAuthor == null || responseEmbed.title == 'SENT' || responseEmbed.title == 'DENIED' || responseEmbed.title == 'OUT OF STOCK')
            return;

        if (emoji == "✅" && responseEmbed.title != 'APPROVED') {
            responseEmbed.setTitle('APPROVED').setColor('#81d82e');
            message.edit({ embeds: [responseEmbed] });
        } else if (emoji == "📨") {
            responseEmbed.setTitle('SENT').setColor('#e9f5dc');
            if (responseEmbed.footer) {
                responseEmbed.footer = null;
                try {
                    await requestAuthor.send({ embeds: [responseEmbed] });
                } catch {
                    console.log('User disabled dms');
                }
            }
            responseEmbed.setFooter({ text: 'by ' + user.username })
            message.edit({ embeds: [responseEmbed] });
            message.reactions.removeAll();
        } else if (emoji == "❌") {
            responseEmbed.setTitle('DENIED').setColor('#ff0000');
            if (responseEmbed.footer) {
                responseEmbed.footer = null;
                try {
                    await requestAuthor.send({ embeds: [responseEmbed] });
                } catch {
                    console.log('User disabled dms');
                }
            }
            message.edit({ embeds: [responseEmbed] });
            message.reactions.removeAll();
        } else if (emoji == "⭕") {
            responseEmbed.setTitle('OUT OF STOCK').setColor('#fff551');
            if (responseEmbed.footer) {
                responseEmbed.footer = null;
                try {
                    await requestAuthor.send({ embeds: [responseEmbed] });
                } catch {
                    console.log('User disabled dms');
                }
            }
            message.edit({ embeds: [responseEmbed] });
            message.reactions.removeAll();
        }
    }
}