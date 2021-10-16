import { MusicStatus, Video } from "../video.model";
import ytsearch from 'yt-search';
import { Message, MessageEmbed } from "discord.js";

export class SearchMusic{
    message : Message;
    search : string;
    videoBySearch : Video[] = []

    constructor(message : Message, search : string, videoBySearch : Video[]){
        this.message = message;
        this.search = search;
        this.videoBySearch = videoBySearch;
    }

    async execute() : Promise<Video[]>{
        let searchVideo = await ytsearch(this.search);
        for (let i = 0; i < 10; i++){
            this.videoBySearch.push({
                index : this.videoBySearch.length + 1,
                name : (this.videoBySearch.length + 1) + '. ' + searchVideo.videos[i].title,
                value : searchVideo.videos[i].author.name,
                url : searchVideo.videos[i].url,
                played : MusicStatus.Waiting
            })
        }
        this.message.channel.send({
            embeds : [new MessageEmbed()
                .setColor('#fffff')
                .setTitle('Search Result')
                .addFields(...this.videoBySearch)
            ]
        })

        return this.videoBySearch;
    }
}