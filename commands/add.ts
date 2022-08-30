import { Message, MessageEmbed } from "discord.js";
import * as playDl from 'play-dl';
import { Server } from "../interface/server";
import { MusicStatus, Song } from "../interface/song";
import { Play } from "./play";

export class AddQueue {
    private message: Message;
    private queue: Song[];
    private server: Server;

    constructor(message: Message, queue: Song[], server: Server) {
        this.message = message;
        this.queue = queue;
        this.server = server;
    }

    async execute(songs: Song[], u?: string | null) {
        try {
            if (!u) {
                this.message.channel.send({ embeds: [new MessageEmbed().setTitle('Please Add Second Argument')] });
            } else if (Number(u)) {
                let song = songs.find((x, i) => i + 1 === Number(u)) as Song;
                this.queue.push({ ...song, name: `${song.name.slice(3)}` });
                this.message.channel.send({ embeds: [new MessageEmbed().setTitle('New Queue Added')] });
            } else {
                let type = await playDl.validate(u).catch(err => this.message.channel.send({ embeds: [new MessageEmbed().setColor('RED').setTitle('Link Not Valid, Link Supported (Youtube, Spotify, and SoundCloud)')] }));
                if (type) {
                    let info = await playDl.video_basic_info(u);
                    this.queue.push({
                        name: info.video_details.title ?? '',
                        value: info.video_details.channel?.name ?? '',
                        url: u,
                        status: MusicStatus.Unplayed
                    });
                    this.message.channel.send({ embeds: [new MessageEmbed().setTitle('New Queue Added')] });
                } else {
                    this.message.channel.send({ embeds: [new MessageEmbed().setTitle('Link Not Valid, Link Supported (Youtube, Spotify, and SoundCloud)')] });
                }
            }

            if (this.queue.filter(x => x.status == MusicStatus.Playing).length <= 0) {
                let play = new Play(this.message, this.server);
                play.execute();
            }
        } catch (error) {
            this.message.channel.send({ embeds: [new MessageEmbed().setColor('RED').setTitle('error' + error)] });
        }
    }
}