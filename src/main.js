const {
    Client,
    Intents,
    Collection
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const NetcatServer = require('netcat/server')

const nc = new NetcatServer()
nc.port(8000).listen()

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
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
