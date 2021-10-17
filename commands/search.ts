import { Message, MessageEmbed } from "discord.js";
import { MusicStatus, Song } from "../interface/song";
import ytsearch from 'yt-search';

export class Search {
    private message: Message;
    private songs: Song[];

    constructor(message: Message, song: Song[]) {
        this.message = message;
        this.songs = song;
    }

    /**
     * @param search
     * @description will send a list of song
     */
    async execute(search?: string | null) {
        if (search) {
            let result = await ytsearch(search);
            for (let i = 0; i < (result.videos.length < 8 ? result.videos.length : 8); i++) {
                this.songs.push({
                    index: this.songs.length + 1,
                    name: (this.songs.length + 1) + '. ' + result.videos[i].title,
                    value: result.videos[i].author.name,
                    url: result.videos[i].url,
                    status: MusicStatus.Unplayed
                })

            }
            this.message.channel.send({
                embeds: [new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('Search Result')
                    .addFields(...this.songs)
                ]
            })
        } else {
            this.message.channel.send('Please Add Second Argument');
        }
    }
}