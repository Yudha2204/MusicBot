

import { Client, Intents, Message, MessageEmbed } from "discord.js";
import dotenv from 'dotenv';

import { MusicStatus, Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { AddQueue } from "./commands/add";
import { Playlist } from "./commands/playlist";
import { Queue } from "./commands/queue";
import { sendCommandInfo, sendToMember } from "./commands/bot";

let prefix : string = '-'; 

dotenv.config();


const botClient = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
    ]
});

let searchSong: Song[] = [];

/**
 * servers Contains a bunch of server list
 * @example [string = { queue : [], player : AudioPlayer, channel : VoiceConnection }]
 */
const servers = new Map<string | null, Server>();

botClient.once('ready', () => {
    console.log('Bot Is Ready');
});

botClient.on('messageCreate', async (msg : Message) => {
    if (!msg.content.startsWith(prefix)) return;
    
    if (!servers.has(msg.guildId)) {
        servers.set(msg.guildId, new Server(msg.guild?.name))
    }
    
    let server = servers.get(msg.guildId) as Server;
    
    const args = msg?.content?.slice(prefix.length).split(/ +/);
    const command = args?.shift()?.toLowerCase();

    //Update server timeStamp, to make sure this server still active or not
    server.timeStamp = new Date();
    switch (command) {
        case 'info' : 
            sendCommandInfo(msg);
            break;

        case 'play' : 
            if (args[0]) {
                let add = new AddQueue(msg, server.queue);
                await add.execute(searchSong, args[0])
            } 
            let play = new Play(msg, server);
            await play.execute();
            break;

        case 'skip' : 
            let skip = new Skip(msg, server);
            await skip.execute(Number(args[0]));
            break;

        case 'pause' : 
            if (!server.player) return;
            server.player.pause();
            server?.channel?.subscribe(server.player);
            break;

        case 'resume' : 
            if (!server.player) return;
            server.player.unpause();
            server?.channel?.subscribe(server.player);
            break;

        case 'search':
            searchSong = []
            let search = new Search(msg, searchSong);
            await search.execute(args.join(' '));
            break;

        case 'add':
            let add = new AddQueue(msg, server.queue);
            await add.execute(searchSong, args[0])
            break;

        case 'queue':
            const queue = new Queue(msg.channel, server.queue);
            queue.execute(args[0]);
            break;

        case 'myid' :
            msg.member?.send(`Your id is ${msg.member.id}`);
            break;

        case 'playlist' : 
            const playlist = new Playlist(msg, server, args)
            await playlist.execute();
            break;

        case 'servers' : 
            sendToMember(msg, servers.size);
            break;
        
        case 'exit':
            msg.channel.send('Thanks, I will take a rest :love_letter:')
            server.player?.stop();
            server.channel?.destroy(true);
            servers.delete(msg.guildId);
            break;
    }
})

/**
 * This Interval Check If The Server Has AudioPlayer Or Not, If Not Then It Will Change Status Of That Server To Inactive
 * And If The Status Already Inactive It Will Delete The Server To Prevent Memory Leak
 */
 setInterval(() => {
    servers.forEach((value, key) => {
        if (value.status === 'inactive') {
            value.player?.stop();
            value.channel?.destroy(true);
            servers.delete(key);
        }
        if ((new Date().getTime() - value.timeStamp.getTime() >= 150000)) {
            value.status = 'inactive';
        }
    })
}, 120000) //2 Minutes

botClient.login(process.env.TOKEN);
