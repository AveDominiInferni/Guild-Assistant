const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const {
    MessageEmbed
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('council')
        .setDescription('councils loot based on loot and attendance')
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

        var names = interaction.options.getString('names').trim().split(/ +/);
        let lootCouncil = new Map;

        for (const name of names) {
            var doc = await client.db('loot').collection(interaction.guildId).findOne({
                p: name.toLowerCase()
            });
            if (!doc) {
                lootCouncil.set(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), 0);
            } else {
                // I should later add values for each item, for now all items are worth the same (1)
                let itemScore = doc.i ? doc.i.length : 0;
                let attendanceScore = doc.a ? doc.a.length + 1 : 1;
                lootCouncil.set(name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), itemScore / attendanceScore);
            }
        }
        client.close();

        lootCouncil = new Map([...lootCouncil.entries()].sort((a, b) => a[1] - b[1]));
        var text = 'Sorted in a descending order based on their i/r:';
        for (let [key, value] of lootCouncil)
            text += `\n${key} - ${value.toFixed(2)}`;

        var councilEmbed = new MessageEmbed()
            .setColor(19092)
            .setAuthor({
                name: 'LOOT COUNCIL'
            })
            .setFooter({
                text: 'i/r - items received / (raids attended + 1)'
            })
            .setDescription(text);

        await interaction.reply({
            content: ' ',
            embeds: [councilEmbed],
            ephemeral: false
        });
    }
}