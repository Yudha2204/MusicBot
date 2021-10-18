

import { Client, EmbedFieldData, Intents, Message, MessageEmbed, TextBasedChannels } from "discord.js";
import dotenv from 'dotenv';

import { initializeApp } from 'firebase/app';
import {getDoc, getFirestore, getDocs, collection, doc, snapshotEqual} from 'firebase/firestore/lite'

import { MusicStatus, Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { AddQueue } from "./commands/add";
import { firebaseConfig } from "./config/firebase.config";

let prefix : string = '-'; 
dotenv.config();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
let servers = new Map<string | null, Server>();

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
            await skip.execute();
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

        case 'list':
            sendQueueList(msg, server.queue);
            break;

        case 'queue':
            sendQueueListFilter(msg, server.queue)
            break;

        case 'exit':
            msg.channel.send('Thanks, I will take a rest :love_letter:')
            server.player?.stop();
            server.channel?.destroy(true);
            servers.delete(msg.guildId);
            break;

        case 'myid' :
            msg.member?.send(`Your id is ${msg.member.id}`);
            break;

        case 'playlist' : 
            if (args[0] == 'play' && args[1]) {
                await playPlaylist(server, msg.guildId, args[1]);
                let play = new Play(msg, server);
                await play.execute();
            } else {
                await getPlayList(msg.channel, msg.guildId);
            }
            break;
        case 'servers' : 
            sendToMember(msg);
            break;
    }
})

async function playPlaylist(server : Server, serverId : string | null, playlistName : string) {
    const dbColection = collection(db, `ServerPlaylist/${serverId}/Playlist/${playlistName}/Song`);
    const dbDocs = await getDocs(dbColection);
    for (let i = 0; i < dbDocs.docs.length; i++) {
        server.queue.push(
            {
                index : Number(dbDocs.docs[i].id), 
                name : dbDocs.docs[i].data().name,
                value : dbDocs.docs[i].data().value,
                url : dbDocs.docs[i].data().url,
                status : MusicStatus.Unplayed
            })
    }
    server.queue.sort((a, b) =>  a.index - b.index);
}

async function getPlayList(channel : TextBasedChannels, serverId : string | null) {
    channel.send('Please Wait Fetching Data :orange_circle:')
    const dbColection = collection(db, `ServerPlaylist/${serverId}/Playlist`);
    const dbDocs = await getDocs(dbColection);
    const playlist  = dbDocs.docs.map(x => x.id);
    const embedMessage : EmbedFieldData[] = []; 
    
    for (let i = 0; i < playlist.length; i++) {
        const dbColection = collection(db, `ServerPlaylist/${serverId}/Playlist/${playlist[i]}/Song`);
        const dbDocs = await getDocs(dbColection);
        embedMessage.push({name : playlist[i], value : dbDocs.size + ' Song'});
    }
    
    channel.send({
        embeds : [
            new MessageEmbed()
            .setTitle('Playlist in this server')
            .addFields(embedMessage)
        ]
    })
}

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
        if (!value.player) {
            value.status = 'inactive'; 
        }
    })
}, 120000)

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

function sendQueueList(message: Message, queue: Song[]) {
    if (queue.length > 0) {
        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('All Status Queue List')
                    .addFields(...queue)
            ]
        });
    } else {
        message.channel.send('Queue Is Empty');
    }
}

function sendQueueListFilter(message: Message, queue: Song[]) {
    let filter = queue.filter(x => x.status === MusicStatus.Unplayed)
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
                    name: 'List',
                    value: 'Show All Song With Status Of Queue',
                    inline: true
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
                }
            )
            .setFooter('Prefix (-) Thanks For Using This Bot', pic)
        ]
    })
}

botClient.login(process.env.TOKEN);
