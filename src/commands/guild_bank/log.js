const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const got = require('got');
const { TimestampString } = require('../../helpers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Uploads log file')
        .addAttachmentOption((option) => {
            return option
                .setName('file')
                .setDescription('GBMLogs.lua')
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

        const attachment = interaction.options.getAttachment('file');
        if (attachment.name != 'GBMLogs.lua') {
            await interaction.reply({
                content: 'Wrong file!',
                ephemeral: true
            });
            return;
        }

        let response = await got(attachment.url, {
            responseType: 'buffer'
        });
        var lines = response.body.toString().split(/\r?\n/).slice(1);

        var bdata = lines[0].slice(8).slice(0, -2);
        UpdateBankLogs(bdata, interaction.guildId);

        var mdata = lines[1].slice(8).slice(0, -2);
        UpdateMailLogs(mdata, interaction.guildId);

        await interaction.reply({
            content: 'Log file has been successfully uploaded!'
        });
    }
}

async function UpdateBankLogs(data, id) {
    const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .catch(err => {
            console.log(err);
        });
    if (!client) return;

    data = data.split('$');
    for (var i = 0; i < data.length; i++)
        data[i] = data[i].split('*');

    var CharNames = [];
    for (var i = 0; i < data.length; i++) {
        CharNames.push(data[i].shift());
        await DeleteBankLogFor(CharNames[i], id)
            .catch(err => {
                console.log(err);
            });
    }

    var bankdb = client.db('bank');

    for (var k = 0; k < CharNames.length; k++) {
        var bag = [];
        for (var i = 0; i < data[k].length; i++) {
            data[k][i] = data[k][i].split('~');
            var new_item = true;
            for (var j = 0; j < bag.length; j++) {
                if (data[k][i][1] == bag[j][0]) {
                    new_item = false;
                    bag[j][1] += parseInt(data[k][i][0]);
                }
            }
            if (new_item == true) {
                bag.push([data[k][i][1], parseInt(data[k][i][0])]);
            }
        }

        await bankdb.collection(id).insertOne({
                c: CharNames[k].toLowerCase(),
                b: bag
            })
            .catch(err => {
                console.log(err);
            });
    }
    client.close();
}

async function UpdateMailLogs(data, id) {
    const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .catch(err => {
            console.log(err);
        });
    if (!client) return;

    if (data != '') {
        var ts = TimestampString();
        var maildb = client.db('mail');
        data = data.split('*');
        for (var i = 0; i < data.length; i++) {
            data[i] = data[i].split('~');
            if (data[i][1] > 0)
                await maildb.collection(id).insertOne({
                    s: data[i][0],
                    n: 'Money',
                    q: parseInt(data[i][1]),
                    t: ts
                });
            if (data[i][3] > 0)
                await maildb.collection(id).insertOne({
                    s: data[i][0],
                    n: data[i][2],
                    q: parseInt(data[i][3]),
                    t: ts
                });
        }
    }
    client.close();
}

async function DeleteBankLogFor(CharName, id) {
    const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .catch(err => {
            console.error(err);
        });
    if (!client) return;

    await client.db('bank').collection(id).deleteOne({
            c: CharName.toLowerCase()
        })
        .catch(err => {
            console.log(`${CharName} not found`);
        })
    client.close();
};