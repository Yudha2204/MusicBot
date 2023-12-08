import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import * as playDl from 'play-dl';
import { Message, MessageEmbed } from "discord.js";
import { MusicStatus, Song } from "../interface/song";
import { Server, ServerStatus } from "../interface/server";
import { PlayerException } from "../interface/exception";

export class Play {
    private message: Message;
    private server: Server;

    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    async execute() {
        try {
            if (!this.message.member?.voice?.channel && !(this.server.channel instanceof VoiceConnection)) {
                throw new PlayerException('You Need To Join Voice Channel :microphone:');
            } else {
                this.server.voiceChannelId = this.message.member?.voice.channelId;

                const adapter = this.message?.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator;
                this.server.channel = joinVoiceChannel({
                    channelId: this.message.member?.voice.channelId ?? '',
                    guildId: this.message.guildId ?? '',
                    adapterCreator: adapter
                });
            }

            if (this.server.paused && this.server.player) {
                this.server.player?.unpause();
                this.server.paused = false;
                this.server?.channel?.subscribe(this.server.player);
                return;
            }

            let filterQueue = this.server.queue.filter((x: Song) => x.status === MusicStatus.Unplayed || x.status === MusicStatus.Next);

            if (filterQueue.length > 0) {

                if (!(this.server.player instanceof AudioPlayer))
                    this.server.player = createAudioPlayer();

                const song = await playDl.stream(filterQueue[0].url);
                const audioResource = createAudioResource(song.stream, {
                    inputType: song.type
                })
                this.server.player.play(audioResource);
                this.server.channel.subscribe(this.server.player);
                filterQueue[0].status = MusicStatus.Playing;

                this.server.currentSong = filterQueue[0];
                this.message.channel.send({ embeds: [new MessageEmbed().setTitle(`Now Playing ${filterQueue[0].name}`)] });

                if (filterQueue.length > 1)
                    filterQueue[1].status = MusicStatus.Next;

                this.server.player.on(AudioPlayerStatus.Idle, async () => {
                    filterQueue[0].status = MusicStatus.Played;
                    await this.execute();
                })


            } else {
                if (this.server.loop) {
                    for (let i = 0; i < this.server.queue.length; i++) {
                        this.server.queue[i].status = MusicStatus.Unplayed;
                    }
                    await this.execute();
                } else {
                    throw new PlayerException(`Im Leaving In 2 Minutes, If No Activity :wave:`);
                }
            }

            this.server.serverStatus = ServerStatus.Active;
        } catch (error: any) {
            if (error instanceof Error) {
                console.log(error.message)
            }

            if (error instanceof PlayerException) {
                this.message.channel.send({ embeds: [error.toEmbed()] })
            }

            this.server.serverStatus = ServerStatus.InActive;
        }
    }

}      