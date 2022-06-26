const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const fs = require('fs')

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = []
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'))
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`)
                client.commands.set(command.data.name, command)
                client.commandArray.push(command.data.toJSON())
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.TOKEN);

        (async () => {
            try {
                console.log('Started refreshing application slash commands.')
                if (process.env.ENV == 'production') {
                    await rest.put(
                        Routes.applicationCommands(process.env.CLIENT), {
                            body: client.commandArray
                        }
                    )
                    console.log('Successfully registered commands globally.');
                } else {
                    await rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT, process.env.GUILD), {
                            body: client.commandArray
                        }
                    )
                    console.log('Successfully registered commands locally.');
                }

            } catch (error) {
                console.error(error)
            }
        })();
    }
}