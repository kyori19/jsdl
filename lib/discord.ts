import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);

export const send = (message: string, mention: boolean = false) =>
    client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
        .then((channel) => {
            if (!channel) {
                throw Error('Channel not found');
            }
            if (!channel.isTextBased()) {
                throw Error('The channel is not text channel');
            }
            if (channel.isDMBased()) {
                throw Error('The channel is not in a guild');
            }
            return channel.send({
                content: `${mention ? '@everyone ' : ''}${message}`,
                allowedMentions: {
                    parse: ['everyone'],
                },
            });
        });
