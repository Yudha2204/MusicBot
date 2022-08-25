import { AudioPlayerStatus, createAudioPlayer, createAudioResource, DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import * as playDl from 'play-dl';
import { EmbedFieldData, Message, MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction } from "discord.js";
import { MusicStatus, Song } from "../interface/song";
import { Server } from "../interface/server";

export class Play {
    private message: Message;
    private server: Server;

    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    async execute() {
        try {
            if (!this.message.member?.voice?.channel) {
                this.message.channel.send('You Need To Join Voice Channel :microphone:')
                return;
            } else {
                const adapter = this.message?.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator;
                this.server.channel = joinVoiceChannel({
                    channelId: this.message.member.voice.channelId ?? '',
                    guildId: this.message.guildId ?? '',
                    adapterCreator: adapter
                });
            }

            if (this.server.paused) {
                if (this.server.player) {
                    this.server.player?.unpause();
                    this.server.paused = false;
                    return this.server?.channel?.subscribe(this.server.player);
                }
            }

            let filterQueue: Song[] = this.server.queue.filter((x: Song) => x.status === MusicStatus.Unplayed || x.status === MusicStatus.Next);

            if (filterQueue.length > 0) {
                this.server.status = 'active';
                this.server.player = createAudioPlayer();
                const song = await playDl.stream(filterQueue[0].url);
                const audioResource = createAudioResource(song.stream, {
                    inputType: song.type
                })
                this.server.player.play(audioResource);
                this.server.channel.subscribe(this.server.player);
                filterQueue[0].status = MusicStatus.Playing;
                if (filterQueue.length > 1)
                    filterQueue[1].status = MusicStatus.Next;
                this.server.player.on(AudioPlayerStatus.Idle, async () => {
                    filterQueue[0].status = MusicStatus.Done;
                    await this.execute();
                })

                let embedField: EmbedFieldData[] = [
                    { name: filterQueue[0].name, value: 'Playing' }
                ]

                if (filterQueue[0].index - 1 != 0) {
                    embedField.push(
                        { name: this.server.queue[filterQueue[0].index - 2].name, value: 'Prev', inline: true }
                    )
                }

                if (filterQueue[0].index + 1 != this.server.queue.length) {
                    embedField.push(
                        { name: this.server.queue[filterQueue[0].index].name, value: 'Next', inline: true }
                    )

                }

                if (!this.server.messageId && this.server.channelControl) {
                    const sent = await this.server.channelControl.send({
                        embeds: [
                            new MessageEmbed()
                                .setTitle('Current Playing')
                                .addFields(embedField)
                        ]
                    })
                    this.server.messageId = sent.id;
                } else {
                    this.message.channel.send(`Now Playing ${filterQueue[0].name}`)
                }

                if (this.server.messageId && this.server.channelControl) {

                    this.server.channelControl.messages.fetch(this.server.messageId).then((msg) => {
                        msg.edit({
                            embeds: [
                                new MessageEmbed()
                                    .setTitle('Current Playing')
                                    .addFields(embedField)
                            ],
                        })
                    })
                }
            } else {
                if (this.server.loop) {
                    for (let i = 0; i < this.server.queue.length; i++) {
                        this.server.queue[i].status = MusicStatus.Unplayed;
                    }
                    await this.execute();
                } else {
                    this.message.channel.send(`Queue Is Empty, I Will Leave Voice Channel If Theres No Activity, :hand_splayed:`);
                    this.server.status = 'inactive';
                }
            }
            this.server.timeStamp = new Date();
        } catch (error) {
            this.message.channel.send('Something went error ' + error);
        }
    }

}      