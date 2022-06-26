const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

module.exports = {
    name: 'ready',
    async execute(bot) {
        const client = await MongoClient.connect(process.env.MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .catch(err => {
                console.log(err);
            });
        if (!client) return;

        if (process.env.ENV == 'production') {
            var col = await client.db('options').collection('requestChannel').find({}).toArray()
                .catch(err => {
                    console.error(err);
                });
            for (const doc of col) {
                try {
                    let guild = bot.guilds.cache.get(doc.k);
                    let requestChannel = guild.channels.cache.get(doc.v);
                    await requestChannel.messages.fetch({});
                } catch (err) {
                    // guild not using the bot anymore
                    console.log('err: guild not using the bot anymore');
                }
            }
        } else {
            var doc = await client.db('options').collection('requestChannel').findOne({ k: process.env.GUILD })
                .catch(err => {
                    console.error(err);
                });
            try {
                let guild = bot.guilds.cache.get(doc.k);
                let requestChannel = guild.channels.cache.get(doc.v);
                await requestChannel.messages.fetch({});
            } catch (err) {
                // guild not using the bot anymore
                console.log('err: guild not using the bot anymore');
            }
        }

        client.close();
        console.log('Ready!');
    }
}