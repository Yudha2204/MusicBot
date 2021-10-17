

import { Client, Intents, Message, MessageEmbed } from "discord.js";
import dotenv from 'dotenv';
import { MusicStatus, Song } from "./interface/song";
import { Play } from "./commands/play";
import { Server } from "./interface/server";
import { Skip } from "./commands/skip";

let prefix : string = '-'; 
dotenv.config();


const botClient = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

let searchVideo : Song[] = [];

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
            queue : [{name : '1 Detik', url : 'https://www.youtube.com/watch?v=DnQlhxV_ijY&ab_channel=AthallahHilalS', status : MusicStatus.Waiting}],
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
            let skip = new Skip(msg, server, Number(args[0]));
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
            for (let i = 0; i < server.queue.length; i++) {
                server.queue[i].status = MusicStatus.Waiting;
            }
            msg.channel.send('Queue Reset, Type -Play To Play Queue')
        break;
        case 'exit' : 
            if (!servers[msg?.guildId ?? '']) return;
            delete servers[msg?.guildId ?? ''];
            console.log(servers);
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
                    name : 'Exit',
                    value : 'Bot Will Leave Channel (Please Use This, If You No Longer Listen To A Music With This Bot)'
                }
            )
            .setFooter('Prefix (-)', pic)
        ]
    })
}

botClient.login(process.env.TOKEN);
