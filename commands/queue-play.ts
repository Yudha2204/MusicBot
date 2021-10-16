import { DiscordGatewayAdapterCreator, joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { Message } from "discord.js";
import * as play from 'play-dl'
import { MusicStatus, Video } from "../video.model";

export class QueuePlay {
    message : Message;
    queue : Video[]
    constructor(message : Message, queue : Video[]){
        this.message = message;
        this.queue = queue;
    }

    async execute() {
        if (!this.message?.member?.voice?.channel) {
            this.message.channel.send('Masuk Voice Channel Dulu Cok!');
            return;
        }
        const adapter = this.message?.guild?.voiceAdapterCreator as unknown;
        const channel = await joinVoiceChannel({
            channelId: this.message?.member?.voice?.channel?.id ?? "",
            guildId: this.message?.guild?.id ?? "",
            adapterCreator : adapter as DiscordGatewayAdapterCreator
        })
        
        const player = createAudioPlayer();
        return await this.playStream(player, channel);
        
    }
    
    private async playStream(player : AudioPlayer, channel : VoiceConnection ){
        try {
            let queueUnplayed = this.queue.filter(x => x.played === MusicStatus.Waiting);
            if (queueUnplayed.length == 0) {
                this.message.channel.send('Queue Udah Diputer Semua');
                return {player : player, channel : channel} 
            } 
            const stream = await play.stream(queueUnplayed[0].url);
            const resource = createAudioResource(stream.stream, {
                inputType : stream.type
            });
            resource?.volume?.setVolume(1);
            player?.play(resource);
            channel.subscribe(player);
            this.message.channel.send(`Now Playing ${queueUnplayed[0].name} :musical_note:` );
            this.updateQueue(queueUnplayed, MusicStatus.Playing);
            player.on('stateChange', async e => {
                if (e.status === 'playing'){
                    player = createAudioPlayer();
                    this.updateQueue(queueUnplayed, MusicStatus.Done);
                    await this.playStream(player, channel);
                }
            })
            return {player : player, channel : channel} 
        } catch (error) {
            console.log(error)
        }
    }


    private updateQueue(queueUnplayed: Video[], status : MusicStatus) {
        for (let i = 0; i < this.queue.length; i++) {
            if (queueUnplayed[0].index === this.queue[i].index) {
                this.queue[i].played = status;
            }
        }
    }
}