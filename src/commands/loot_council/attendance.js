const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const { TimestampString } = require('../../helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance')
        .setDescription('Gives attendance points to players')
        .addStringOption((option) => {
            return option
                .setName('names')
                .setDescription('Player names')
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
        var names = interaction.options.getString('names').trim().split(/ +/);

        for (const name of names) {
            var doc = await client.db('loot').collection(interaction.guildId).findOne({
                p: name.toLowerCase()
            });
            if (!doc) {
                var data = {
                    "p": name.toLowerCase(),
                    "a": [{
                        "d": date
                    }]
                }
                await client.db('loot').collection(interaction.guildId).insertOne(data);
            } else {
                await client.db('loot').collection(interaction.guildId).updateOne({
                    p: name.toLowerCase()
                }, {
                    $push: {
                        a: {
                            d: date,
                        }
                    }
                })
            }
        }

        client.close();
        await interaction.reply({
            content: `The following players have been awarded attendance points: ${names}`,
            ephemeral: false
        });
    }
}