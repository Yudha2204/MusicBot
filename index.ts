

import { Client, Intents, Collection, Message } from "discord.js";
import dotenv from 'dotenv';
import { MusicStatus, Video } from "./video.model";
import { QueueList } from "./commands/queue-list";
import { QueueAdd } from "./commands/queue-add";
import { QueuePlay } from "./commands/queue-play";
import { SearchMusic } from "./commands/search-music";

dotenv.config();

let searchVideo : Video[] = [];

const botClient = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

const client : any = botClient;
client.queue = [];
client.channel = {};
client.player = {};

botClient.once('ready', () => {
    console.log('Bot Is Ready');
});

botClient.on('messageCreate', async (msg : Message) => {
    if (!msg.content.startsWith('-')) return;
    const args = msg?.content?.slice(1).split(/ +/);
    const command = args?.shift()?.toLowerCase();
    switch (command) {
        case 'play' : 
            await playCommand(msg, args);
        break;
        case 'skip' : 
            let skip = Number(args[0]);
            
        break;
        case 'search' : 
            searchVideo = [];
            let search = new SearchMusic(msg, args.join(' '), searchVideo);
            searchVideo = await search.execute();
        break;
        case 'list' :
            let list = new QueueList(msg, client.queue);
            await list.execute();
        break;
        case 'add' : 
                let newQueue = new QueueAdd(msg, args[0], client.queue, searchVideo)
                await newQueue.execute();
                searchVideo = [];
        break;
        case 'pause' :
            client.player.pause();
            client.channel.subscribe(client.player);
        break;
        case 'resume' : 
            client.player.unpause();
            client.channel.subscribe(client.player);
        break;
        case 'reset' : 
            client.queue.forEach((data : Video) => {
                data.played = MusicStatus.Waiting
            });
        break;
    }
})

botClient.login(process.env.TOKEN);

async function playCommand(msg: Message, args: string[]) {
    /**
     * Commands
     * Play URL : Add song to queue, then play it
     * Play Number Of Song From SearchVideo, Add song
     */
    let newQueue = new QueueAdd(msg, args[0], client.queue, searchVideo);
    const success = await newQueue.execute();
    searchVideo = [];

    if (success) {
        let queuePlay = new QueuePlay(msg, client.queue);
        const data = await queuePlay.execute();
        client.channel = data?.channel;
        client.player = data?.player;
    }
}
