const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const { TimestampString } = require('../../helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loot')
        .setDescription('Gives loot to a player')
        .addStringOption((option) => {
            return option
                .setName('name')
                .setDescription('Player name')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('item')
                .setDescription('Item name')
                .setRequired(true)
        }),

    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply({
                content: 'No permission',
                ephemeral: true
            });
            return;
        }

        const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .catch(err => {
                console.log(err);
            });
        if (!client) return;

        var date = TimestampString();
        var name = interaction.options.getString('name');
        var item = interaction.options.getString('item');

        var doc = await client.db('loot').collection(interaction.guildId).findOne({
            p: name.toLowerCase()
        });
        if (!doc) {
            var data = {
                "p": name.toLowerCase(),
                "i": [{
                    "d": date,
                    "n": item.toLowerCase()
                }]
            }
            await client.db('loot').collection(interaction.guildId).insertOne(data);
        } else {
            await client.db('loot').collection(interaction.guildId).updateOne({
                p: name.toLowerCase()
            }, {
                $push: {
                    i: {
                        d: date,
                        n: item.toLowerCase()
                    }
                }
            })
        }
        client.close();
        await interaction.reply({
            content: `${name} has looted ${item}`,
            ephemeral: false
        });
    }
}