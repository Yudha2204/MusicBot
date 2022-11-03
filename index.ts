

import { Client, Intents, Message, MessageEmbed } from "discord.js";
import dotenv from 'dotenv';

import { Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { AddQueue } from "./commands/add";
import { Playlist } from "./commands/playlist";
import { Queue } from "./commands/queue";
import { sendCommandInfo, sendNews, sendInfo } from "./commands/bot";
import { Remove } from "./commands/remove";
import { Controls } from "./commands/controls";

let prefix: string = '-';
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
 * @example [string = { queue : [], player : AudioPlayer, channel : VoiceConnection }]
 */
const servers = new Map<string | null, Server>();

botClient.once('ready', async (client) => {
    console.log('Bot Is Ready');
});

botClient.on('messageCreate', async (msg: Message) => {
    if (!msg.content.startsWith(prefix)) return;

    if (!servers.has(msg.guildId)) {
        servers.set(msg.guildId, new Server())
    }

    let server = servers.get(msg.guildId) as Server;

    const args = msg?.content?.slice(prefix.length).split(/ +/);
    const command = args?.shift()?.toLowerCase();
    //Update server timeStamp, to make sure this server still active or not
    server.timeStamp = new Date();

    switch (command) {
        case 'info':
            sendCommandInfo(msg);
            break;

        case 'play':
            if (args[0]) {
                let add = new AddQueue(msg, server.queue, server);
                await add.execute(server.searchSong, args[0]);
            }
            let play = new Play(msg, server);
            await play.execute();
            break;

        case 'skip':
            let skip = new Skip(msg, server);
            let skipInt = !args[0] ? 1 : Number(args[0])
            await skip.execute(skipInt);
            break;

        case 'pause':
            if (!server.player) return;
            if (server.player.pause()) {
                server.paused = true;
                server?.channel?.subscribe(server.player);
            }
            break;

        case 'resume':
            if (!server.player) return;
            if (server.player.unpause()) {
                server.paused = false;
                server?.channel?.subscribe(server.player);
            }
            break;

        case 'search':
            server.searchSong = []
            let search = new Search(msg, server.searchSong);
            await search.execute(args.join(' '));
            break;

        case 'add':
            let add = new AddQueue(msg, server.queue, server);
            await add.execute(server.searchSong, args[0])
            break;
        case 'prev':
            let control1 = new Controls(msg, server);
            await control1.prev();
            break;
        case 'next':
            let control2 = new Controls(msg, server);
            await control2.next();
            break;
        case 'queue':
            const queue = new Queue(msg.channel, server.queue);
            queue.execute(args[0]);
            break;

        case 'myid':
            msg.member?.send(`Your id is ${msg.member.id}`);
            break;

        case 'serverid':
            if (msg.member?.permissions.has('ADMINISTRATOR')) {
                msg.channel.send(`Server Id : ${msg.guildId}`);
            }
            break;

        case 'playlist':
            const playlist = new Playlist(msg, server, args, server.searchSong)
            await playlist.execute();
            break;

        case 'loop':
            server.loop = !server.loop;
            msg.channel.send({ embeds: [new MessageEmbed().setTitle(server.loop ? `Loop Enable` : 'Loop Disabled')] });
            break;

        case 'servers':
            sendInfo(msg, servers);
            break;

        case 'news':
            sendNews(msg);
            break;

        case 'remove':
            const remove = new Remove(msg, server);
            remove.execute(Number(args[0]))
            break;

        case 'shuffle':
            const shuffle = new Controls(msg, server);
            shuffle.shuffle()
            break;

        case 'memory':
            const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

            const memoryData = process.memoryUsage();

            const memoryUsage = {
                rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
                heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
                heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
                external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,
            };

            msg.channel.send({ embeds: [new MessageEmbed().setTitle('Memory Usage On This Bot').addFields({ name: 'rss', value: memoryUsage.rss }, { name: 'heapTotal', value: memoryUsage.heapTotal }, { name: 'heapUsed', value: memoryUsage.heapUsed }, { name: 'external', value: memoryUsage.external })] })
            break;

        case 'exit':
            msg.channel.send('Im Leaving :sus:');
            server.player?.stop();
            server.channel?.destroy(true);
            servers.delete(msg.guildId);
            break;
    }

    /**
     * This Interval Check If The Server Has AudioPlayer Or Not, If Not Then It Will Change Status Of That Server To Inactive
     * And If The Status Already Inactive It Will Delete The Server To Prevent Memory Leak
     */
    setInterval(() => {
        servers.forEach(async (value, key) => {
            let date = new Date()
            if ((date.getTime() - value.timeStamp.getTime() >= 150000 && value.status === 'inactive')) {
                value.player?.stop();
                value.channel?.destroy(true);
                servers.delete(key);
            }

            if (date.getTime() - value.timeStamp.getTime() >= 150000) {
                if (!value.loop) {
                    value.status === 'inactive'
                    value.timeStamp = date
                }
            }
        })
    }, 120000) //2 Minutes
})


botClient.login(process.env.TOKEN);
