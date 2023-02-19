const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js')
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription('Make a request from the guild bank')
        .addStringOption((option) => {
            return option
                .setName('text')
                .setDescription('your request')
                .setRequired(true)
        })
        .addBooleanOption((option) => {
            return option
                .setName('dm')
                .setDescription('Do you want to receive dms about your request status?')
                .setRequired(false)
        }),
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});
        const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .catch(err => {
                console.log(err);
            });
        if (!client) return;

        if (interaction.member.permissions.has('ADMINISTRATOR')) {
            await interaction.editReply({
                content: 'All requests will be posted in this channel from now on!',
            });
            var col = await client.db('options').collection('requestChannel').findOne({ k: interaction.guildId })
                .catch(err => {
                    console.error(err);
                });
            if (col) {
                await client.db('options').collection('requestChannel').deleteOne({
                    k: interaction.guildId
                })
                    .catch(err => {
                        console.error(err);
                    });
            }
            await client.db('options').collection('requestChannel').insertOne({
                k: interaction.guildId,
                v: interaction.channelId
            });

            client.close();
            return;
        }

        var col = await client.db('options').collection('requestChannel').findOne({ k: interaction.guildId })
            .catch(err => {
                console.error(err);
            });
        if (!col) {
            await interaction.editReply({
                content: 'Request channel hasnt been set up yet.',
                ephemeral: true
            });
            return;
        }
        var channelId = col.v;
        client.close();

        let requestEmbed = new MessageEmbed()
            .setColor(19092)
            .setDescription(interaction.options.getString('text'))
            .setAuthor({ 
                name: `${interaction.member.displayName}/${interaction.user.id}`,
                iconURL: interaction.member.displayAvatarURL()
            })
            .setTimestamp(interaction.createdTimestamp);
        if (interaction.options.getBoolean('dm')) {
            requestEmbed.setFooter({ text: 'This person will receive a dm after the request has been handled' });
        }
        
        interaction.guild.channels.cache.get(channelId).send({ embeds: [requestEmbed] })
            .then(embedMessage => {
                embedMessage.react("✅");
                embedMessage.react("❌");
                embedMessage.react("⭕");
                embedMessage.react("📨");
            });
        await interaction.editReply({
            content: 'Request has been made',
            ephemeral: true
        });
    }
}
