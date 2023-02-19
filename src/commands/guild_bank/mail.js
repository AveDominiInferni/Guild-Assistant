const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const {
    MessageAttachment
} = require('discord.js')
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const { MoneyString } = require('../../helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mail')
        .setDescription('Returns the mail logs as a .txt file')
        .addStringOption((option) => {
            return option
                .setName('name')
                .setDescription('Filter only a specific character')
        }),
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.editReply({
                content: 'No permission',
                ephemeral: true
            });
            return;
        }

        await interaction.editReply({
            content: ' ',
            ephemeral: true,
            files: [await SearchMail(interaction.options.getString('name'), interaction.guildId)]
        });
    }
}

async function SearchMail(charName, id) {
    const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .catch(err => {
            console.error(err);
        });
    if (!client) return;

    var col;
    var content = '';
    if (charName) {
        charName = charName.charAt(0).toUpperCase() + charName.slice(1).toLowerCase();
        col = await client.db('mail').collection(id).find({
                s: charName
            }).toArray()
            .catch(err => {
                console.error(err);
            });
    } else {
        col = await client.db('mail').collection(id).find({}).toArray()
            .catch(err => {
                console.error(err);
            });
    }

    for (var i = 0; i < col.length; i++) {
        if (col[i].n.toLowerCase() == 'money')
            content += col[i].t + "  " + col[i].s + ' sent ' + MoneyString(col[i].q) + '\n';
        else
            content += col[i].t + "  " + col[i].s + ' sent ' + col[i].q + ' x ' + col[i].n + '\n';
    }

    client.close();
    return new MessageAttachment(Buffer.from(content), (charName ? 'MailLogsFor' + charName : 'MailLogs') + '.txt');
}
