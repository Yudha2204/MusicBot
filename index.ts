

import { Client, Intents, Message, TextChannel } from "discord.js";
import dotenv from 'dotenv';

import { Server, ServerStatus } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { sendCommandInfo, sendNews, sendInfo } from "./commands/bot";

let defaultPrefix: string = '-';
dotenv.config();


const botClient = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ]
});
/**
 * servers Contains a bunch of server list
 */
const servers = new Map<string, Server>();

botClient.once('ready', async (client) => {
    console.log('Bot Is Ready');
});

botClient.on('messageCreate', async (msg: Message) => {
    if (!msg.content.startsWith(defaultPrefix)) return;

    if (!servers.has(msg.guildId!)) {
        servers.set(msg.guildId!, new Server(msg.channel as TextChannel))
    }

    let server = servers.get(msg.guildId!) as Server;

    const args = msg?.content?.slice(defaultPrefix.length).split(/ +/);
    const command = args?.shift()?.toLowerCase();

    server.serverId = msg.guildId;

    switch (command) {
        case 'info':
            sendCommandInfo(msg);
            break;

        case 'play':
            server.play(msg.member?.voice?.channel);
            break;

        case 'skip':
            let skip = new Skip(msg, server);
            let skipInt = !args[0] ? 1 : Number(args[0])
            await skip.execute(skipInt);
            break;

        case 'pause':
            server.pauseSong();
            break;

        case 'resume':
            server.resumeSong();
            break;

        case 'search':
            server.searchSong = []
            let search = new Search(msg, server.searchSong);
            await search.execute(args.join(' '));
            break;

        case 'add':
            server.addQueue(args[0]);
            break;

        case 'prev':
            server.prevSong();
            break;

        case 'next':
            server.nextSong();
            break;

        case 'queue':
            server.showQueueList();
            break;

        case 'loop':
            server.setLoopStatus();
            break;

        case 'servers':
            sendInfo(msg, servers);
            break;

        case 'news':
            sendNews(msg);
            break;

        case 'remove':
            server.removeQueue(Number(args[0]));
            break;

        case 'shuffle':
            server.shuffleQueue();
            break;

        case 'exit':
            msg.channel.send('Im Leaving :sus:');
            server.destroy();
            servers.delete(server.serverId!);
            break;
    }


    if (server.loop)
        server.serverStatus = ServerStatus.Active;

    if (server.serverStatus == ServerStatus.InActive && !server.timeout) {
        server.timeout = setTimeout(() => {
            server.player?.stop();
            server.channel?.destroy(true);
            servers.delete(server.serverId!);
        }, server.timeoutTime)
    } else {
        if (server.timeout) {
            clearTimeout(server.timeout);
            server.timeout = null;
        }
    }
})


botClient.login(process.env.TOKEN);
