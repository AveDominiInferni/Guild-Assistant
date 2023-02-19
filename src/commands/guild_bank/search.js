const { SlashCommandBuilder } = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const { MoneyString, IsSubstr } = require('../../helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for an item in the guild bank')
        .addStringOption((option) => {
            return option
                .setName('item')
                .setDescription('Full or partial item name')
                .setRequired(true)
        }),
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        let result = await SearchBank(interaction.options.getString('item'), interaction.guildId);
        if (result) {
            await interaction.editReply({
                content: result,
                ephemeral: true
            });
        }
        else {
            await interaction.editReply({
                content: 'Something went wrong!',
                ephemeral: true
            });
        }
        
    }
}

async function SearchBank(itemName, id) {
    const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .catch(err => {
            console.error(err);
        });
    if (!client) return;

    var col = await client.db('bank').collection(id).find({}).toArray()
        .catch(err => {
            console.error(err);
        });

    if (col.length == 0) {
        return `No logs have been uploaded yet`;
    }
    var header = `Search results for ${itemName}:`;
    var content = '';
    try {
        for (var i = 0; i < col.length; i++) {
            for (var j = 0; j < col[i].b.length; j++) {
                if (IsSubstr(itemName.toLowerCase(), col[i].b[j][0].toLowerCase())) {
                    if (col[i].b[j][0].toLowerCase() == 'money') {
                        let amount = MoneyString(col[i].b[j][1]);
                        content += `\n- ${col[i].c} has ${amount}`;
                    } else {
                        let amount = col[i].b[j][1];
                        content += `\n- ${col[i].c} has ${amount} x ${col[i].b[j][0]}`;
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.close();
        if (content == '')
            return `No results`;
        else
            return `${header}${content}`;
    }
}
