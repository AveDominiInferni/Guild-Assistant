const {
    SlashCommandBuilder
} = require('@discordjs/builders');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('storage')
        .setDescription('Returns info about the storage used'),
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

        let bankStats = await client.db('bank').collection(interaction.guildId).stats();
        let mailStats = await client.db('mail').collection(interaction.guildId).stats();
        let lootStats = await client.db('loot').collection(interaction.guildId).stats();
        var storageSize = (bankStats.storageSize + mailStats.storageSize + lootStats.storageSize) / 1024 / 1024;

        console.log();
        client.close();
        await interaction.reply({
            content: `${storageSize.toFixed(2)}/10 MB (${(storageSize / 10 * 100).toFixed(2)}%)`,
            ephemeral: true
        });
        return;
    }
}