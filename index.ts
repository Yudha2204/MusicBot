

import { Client, Intents, Message, MessageEmbed } from "discord.js";
import dotenv from 'dotenv';
import { MusicStatus, Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";
import { Search } from "./commands/search";
import { AddQueue } from "./commands/add";

let prefix : string = '-'; 
dotenv.config();


const botClient = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

let searchSong: Song[] = [];

/**
 * servers Contains a bunch of server list
 * @example [GuildId = { queue : [], player : AudioPlayer, channel : VoiceConnection }]
 */
let servers = {};

botClient.once('ready', () => {
    console.log('Bot Is Ready');
});

botClient.on('messageCreate', async (msg : Message) => {
    if (!msg.content.startsWith(prefix)) return;

    if (!servers[msg?.guildId ?? '']) {
        servers[msg?.guildId ?? ''] = {
            queue: [],
            player : null,
            channel : null,
            status : 'active' 
        }
    }

    let server : Server = servers[msg?.guildId ?? ''];

    const args = msg?.content?.slice(prefix.length).split(/ +/);
    const command = args?.shift()?.toLowerCase();
    
    switch (command) {
        case 'info' : 
            sendCommandInfo(msg);
            break;

        case 'play' : 
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
            if (!servers[msg?.guildId ?? '']) return;
            servers[msg?.guildId ?? ''].player.stop();
            servers[msg?.guildId ?? ''].channel.destroy(true);
            delete servers[msg?.guildId ?? ''];
            break;
    }
})

// let interVal = setInterval(() => {
//     for (let i = 0; i < serverIds.length; i++) {
//         if (servers[serverIds[i]].status == 'inactive') {
//             delete servers[serverIds[i]];
//         }
//     }
// }, 30000)

function sendQueueList(message: Message, queue: Song[]) {
    if (queue.length > 0) {
        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('Queue List')
                    .addFields(...queue)
            ]
        });
    } else {
        message.channel.send('Queue Is Empty');
    }
}

function sendQueueListFilter(message: Message, queue: Song[]) {
    if (queue.length > 0) {
        let filter = queue.filter(x => x.status === MusicStatus.Unplayed)
        message.channel.send({
            embeds: [
                new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('Queue List')
                    .addFields(...filter)
            ]
        });
    } else {
        message.channel.send('Queue Is Empty');
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
                    name : 'Play',
                    value : 'Play A Music If There a Queue'
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
                    value : 'Bot Will Leave Channel (Please Use This, If You No Longer Listen To A Music With This Bot)'
                }
            )
            .setFooter('Prefix (-)', pic)
        ]
    })
}

botClient.login(process.env.TOKEN);
