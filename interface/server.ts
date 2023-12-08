import { AudioPlayer, AudioPlayerStatus, DiscordGatewayAdapterCreator, VoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import { MusicStatus, Song } from "./song";
import { PlayerException } from "./exception";
import * as playDl from 'play-dl';
import { MessageEmbed, TextChannel, VoiceBasedChannel } from "discord.js";

export class Server {
    serverId: string | null = null;
    voiceChannelId?: string | null = null;
    timeoutTime: number = 240000; // Default 4 Minute
    timeout: NodeJS.Timeout | null = null;
    queue: Song[] = [];
    searchSong: Song[] = [];
    currentSong?: Song | null = null;
    channel: VoiceConnection | null = null;
    player: AudioPlayer;
    serverStatus: ServerStatus = ServerStatus.InActive;
    playingStatus: PlayingStatus = PlayingStatus.Stopped;
    loop: boolean = false;
    paused: boolean = false;

    private _textChannel: TextChannel;

    constructor(textChannel: TextChannel) {
        this._textChannel = textChannel;
        this.player = createAudioPlayer();
    }

    async play(voiceChannel?: VoiceBasedChannel | null, song?: Song) {
        if (!voiceChannel && !(this.channel instanceof VoiceConnection))
            throw new PlayerException('You Need To Join Voice Channel :microphone:');

        if (!this.channel) {
            this.voiceChannelId = voiceChannel?.id;

            const adapter = this._textChannel.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator;
            this.channel = joinVoiceChannel({
                channelId: this.voiceChannelId ?? '',
                guildId: this.serverId ?? '',
                adapterCreator: adapter
            });
        }

        if (!song) {
            song = this.queue[0];
            this.queue[0].status = MusicStatus.Playing;
        }

        const songStream = await playDl.stream(song.url);
        const audioResource = createAudioResource(songStream.stream, {
            inputType: songStream.type,
        })

        this.player.play(audioResource);
        this.channel!.subscribe(this.player!);

        this.serverStatus = ServerStatus.Active;
        this.playingStatus = PlayingStatus.Playing;

        this.currentSong = song;
        this.player!.removeAllListeners(AudioPlayerStatus.Idle);

        this.player!.on(AudioPlayerStatus.Idle, () => {
            this.serverStatus = ServerStatus.InActive;
            this.playingStatus = PlayingStatus.Stopped;
            this.nextSong();
        })
    }

    resumeSong() {
        if (this.playingStatus == PlayingStatus.Paused) {
            if (this.player!.unpause()) {
                this.timeoutTime = 240000;
                this.serverStatus = ServerStatus.Active;
                this.playingStatus = PlayingStatus.Playing;
            }
        }

        return this;
    }

    pauseSong() {
        if (this.playingStatus == PlayingStatus.Playing) {
            if (this.player!.pause()) {
                this.timeoutTime *= 5;
                this.serverStatus = ServerStatus.InActive;
                this.playingStatus = PlayingStatus.Paused;
            }
        }
    }

    nextSong() {
        try {
            if (this.queue.length == 0)
                throw new PlayerException('No queue');

            let currentIndex = this.queue.findIndex(x => x.status == MusicStatus.Playing);
            let nextIndex = currentIndex + 1;

            if (nextIndex > this.queue.length - 1)
                throw new PlayerException('There no next song');

            this.queue[currentIndex].status = MusicStatus.Played;
            this.queue[nextIndex].status = MusicStatus.Playing;

            this.play(undefined, this.queue[nextIndex]);

            return this;
        } catch (error: any) {
            if (error instanceof PlayerException) {
                this._textChannel.send({ embeds: [error.toEmbed()] })
            }

            throw error;
        }
    }

    prevSong() {
        try {
            if (this.queue.length == 0) {
                throw new PlayerException('No queue');
            }

            let currentIndex = this.queue.findIndex(x => x.status == MusicStatus.Playing);
            let prevIndex = currentIndex - 1;

            if (prevIndex < 0)
                throw new PlayerException('There no prev song');

            this.queue[currentIndex].status = MusicStatus.Unplayed;
            this.queue[prevIndex].status = MusicStatus.Playing;

            this.play(undefined, this.queue[prevIndex]);
            return this;
        } catch (error: any) {
            if (error instanceof PlayerException) {
                this._textChannel.send({ embeds: [error.toEmbed()] })
            }

            throw error;
        }
    }

    shuffleQueue() {
        let currentIndex = this.queue.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            // And swap it with the current element.
            [this.queue[currentIndex], this.queue[randomIndex]] = [
                this.queue[randomIndex], this.queue[currentIndex]
            ];
        }
    }

    /**
     * @param {string | number | number[]} u - It can contain youtube url, or index of the searched song
    **/

    async addQueue(u: string | number | number[]) {
        try {
            if (typeof u == 'string') {
                let type = await playDl.validate(u).catch(err => { throw new PlayerException('Link Not Valid, Link Supported (Youtube, Spotify, and SoundCloud)') });

                if (type) {
                    // Get the info of the url
                    let info = await playDl.video_basic_info(u);
                    this.queue.push({
                        no: this.queue.length + 1,
                        name: info.video_details.title ?? '',
                        value: info.video_details.channel?.name ?? '',
                        url: u,
                        status: MusicStatus.Unplayed
                    });

                    this._textChannel.send({ embeds: [new MessageEmbed().setTitle('New Queue Added')] });
                }
            }

            if (typeof u == 'number') {
                if (this.searchSong.length == 0)
                    throw new PlayerException('Please search a song first with command -search song name');

                let indexOfTheSong = this.searchSong.findIndex(x => x.no == u);

                if (indexOfTheSong < 0)
                    throw new PlayerException('Song you selected not in the list, please check number');

                this.queue.push(this.searchSong[indexOfTheSong]);
            }

            if (Array.isArray(u)) {
                if (this.searchSong.length == 0)
                    throw new PlayerException('Please search a song first with command -search song name');

                for (let i = 0; i < u.length; i++) {
                    let indexOfTheSong = this.searchSong.findIndex(x => x.no == u[i]);

                    if (indexOfTheSong < 0)
                        throw new PlayerException('Song you selected not in the list, please check number');

                    this.queue.push(this.searchSong[indexOfTheSong]);
                }
            }

            clearTimeout(this.timeout!);
            this.timeout = null;
            this.timeoutTime *= 2;

            return this;
        } catch (error: any) {
            if (error instanceof PlayerException) {
                this._textChannel.send({ embeds: [error.toEmbed()] })
            }

            throw error;
        }
    }

    removeQueue(index: number) {
        // let message = 
        //to do remove queue
    }

    showQueueList() {
        let filter = this.queue.map((x, i) => {
            return { name: `${i + 1}. ${x.name}`, value: `${x.value} (${x.status})` }
        })
        if (filter.length > 0) {
            this._textChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Queue')
                        .addFields(...filter)
                ]
            });
        } else {
            this._textChannel.send('There No Song In Queue');
        }
    }

    setLoopStatus() {
        this.serverStatus = ServerStatus.Active;
        this.loop = !this.loop;
        this._textChannel.send({ embeds: [new MessageEmbed().setTitle(this.loop ? `Loop Enable` : 'Loop Disabled')] });
    }

    destroy() {
        this.player.stop(true);
        this.channel?.destroy(true);
    }

    getArgsType(args: any): 'number' | 'url' {
        if (Number.isNaN(args)) {
            return 'url';
        }

        return 'number';
    }
}

export enum PlayingStatus {
    Playing = 'Playing',
    Paused = 'Paused',
    Stopped = 'Stopped'
}

export enum ServerStatus {
    Active = 'Active',
    InActive = 'InActive'
}