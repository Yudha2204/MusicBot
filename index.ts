

import { Client, Intents, Message, MessageEmbed } from "discord.js";
import dotenv from 'dotenv';

import { MusicStatus, Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { AddQueue } from "./commands/add";
import { Playlist } from "./commands/playlist";

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

        case 'reset' :
            resetQueue(server, msg);
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
            sendQueueListFilter(msg, server.queue)
            break;

        case 'myid' :
            msg.member?.send(`Your id is ${msg.member.id}`);
            break;

        case 'playlist' : 
            const playlist = new Playlist(msg, server, args)
            await playlist.execute();
            break;

        case 'servers' : 
            sendToMember(msg);
            break;
        
        case 'exit':
            msg.channel.send('Thanks, I will take a rest :love_letter:')
            server.player?.stop();
            server.channel?.destroy(true);
            servers.delete(msg.guildId);
            break;
    }
})
//#region QueueList
function sendQueueListFilter(message: Message, queue: Song[]) {
    let filter = queue.map(x => {
        x.value + ` ${x.status}`
        return x;
    })
    if (filter.length > 0) {
        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('Unplayed Queue List')
                    .addFields(...filter)
            ]
        });
    } else {
        message.channel.send('There No Unplayed Song, Type -Reset Then -Play To Repeat Queue');
    }
}

function resetQueue(server: Server, msg: Message) {
    for (let i = 0; i < server.queue.length; i++) {
        server.queue[i].status = MusicStatus.Unplayed;
    }
    msg.channel.send('Queue Reset, Type -Play To Play Queue');
}
//#endregion

//#region Information
function sendCommandInfo(message : Message){
    let pic = 'https://lh3.googleusercontent.com/ogw/ADea4I4RMxkL1oEULYQ_hq46GyYA-NK3y8pRkHoMtpqv=s83-c-mo';
    message.channel.send({
        embeds : [
            new MessageEmbed() 
            .setColor("#04eded")
            .setTitle('Command Info')
            .setThumbnail(pic)
            .addFields(
                {
                    name : 'Info',
                    value : 'Show All Command List'
                },
                {
                    name : 'Playlist',
                    value : 'Show All Server Playlist'
                },
                {
                    name : 'Playlist PlaylistName',
                    value : 'Show All Song In Playlist'
                },
                {
                    name : 'Playlist Play PlaylistName',
                    value : 'Play Song From Playlist'
                },
                {
                    name : 'Playlist Save PlaylistName',
                    value : 'Save Queue To Server Playlist'
                },
                {
                    name : 'Play | (Number / Url) (Optional)',
                    value : 'Play A Music If There a Queue, Or Add Song Then Play It'
                },
                {
                    name : 'Skip (Number)',
                    value : 'Skip Queue To Next Song'
                },
                {
                    name : 'Pause',
                    value : 'Pause Current Music',
                    inline : true
                },
                {
                    name : 'Resume',
                    value : 'Resume Current Music',
                    inline : true
                },
                {
                    name: 'Queue',
                    value: 'Show Unplayed Song Only',
                    inline: true
                },
                {
                    name: 'Add (Url Or Number)',
                    value: 'Add Song Into Queue'
                },
                {
                    name : 'Exit',
                    value : 'Please Use This, If You No Longer Listen To A Music With This Bot'
                })
            .setFooter('Prefix (-) Thanks For Using This Bot', pic)
        ]
    })
}


function sendToMember(msg: Message) {
    msg.member?.send({
        embeds: [
            new MessageEmbed()
                .setTitle('Server That Using This Bot')
                .addFields(
                    { name: 'Servers Active', value: servers.size.toString() }
                )
                .setTimestamp(new Date())
        ]
    });
}
//#endregion


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
}, 120000)

botClient.login(process.env.TOKEN);
