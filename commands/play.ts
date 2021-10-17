import { AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import * as playDl from 'play-dl';
import { Message } from "discord.js";
import { MusicStatus, Song } from "../interface/song";
import { Server } from "../interface/server";

export class Play {
    private message : Message;
    private server : Server;

    constructor(message : Message, server : Server) {
        this.message = message;
        this.server = server;
    }

    async execute() {
        if (!this.message.member?.voice?.channel) {
            this.message.channel.send('You Need To Join Voice Channel :microphone:')
            return;
        } else {
            const adapter = this.message?.guild?.voiceAdapterCreator as unknown;
            this.server.channel = joinVoiceChannel({
                channelId : this.message.member.voice.channelId ?? '',
                guildId : this.message.guildId ?? '',
                adapterCreator : adapter as DiscordGatewayAdapterCreator
            });
        }

        let filterQueue : Song[] = this.server.queue.filter((x : Song) => x.status === MusicStatus.Waiting);

        if (filterQueue.length > 0) {
            this.server.player = createAudioPlayer();
            const song = await playDl.stream(filterQueue[0].url);
            const audioResource = createAudioResource(song.stream, {
                inputType : song.type
            })
            this.server.player.play(audioResource);
            this.server.channel.subscribe(this.server.player);
            filterQueue[0].status = MusicStatus.Playing;
            this.server.player.on(AudioPlayerStatus.Idle, async () => {
                filterQueue[0].status = MusicStatus.Done;
                await this.execute();
                return;
            })
            this.message.channel.send(`Now Playing ${filterQueue[0].name} :musical_note:`);
        } else {
            this.message.channel.send(`Queue Is Empty, I Will Leave Voice Channel, Good By :hand_splayed:`);
            if (this.server.player !== null) {
                this.server.player?.stop();
                this.server.channel?.destroy(true);
                this.server.player = null;
                this.server.channel = null;
                this.server.status = 'inactive';
            }
        }   
    }

}