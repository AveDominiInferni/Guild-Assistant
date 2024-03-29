const {
    Client,
    Intents,
    Collection
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const express = require('express')
const app = express()
const port = 8000

app.get('/', (req, res) => {
    res.send('Healthy!')
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ]
});

client.commands = new Collection();

const functions = fs.readdirSync('./src/functions').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
const commandFolders = fs.readdirSync('./src/commands');

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles);
    client.handleCommands(commandFolders, './src/commands');
    client.login(process.env.TOKEN);
})();
