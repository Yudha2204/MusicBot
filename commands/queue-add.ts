import { Message } from "discord.js";
import { MusicStatus, Video } from "../video.model";
import * as play from 'play-dl'
export class QueueAdd {
    message : Message;
    url : string;
    queue : Video[] = [];
    videoBySearch : Video[] = [];
    constructor(
        message : Message, 
        url : string, 
        queue : Video[],
        videoBySearch : Video[],
        )
    {
        this.message = message;
        this.url = url;
        this.queue = queue;
        this.videoBySearch = videoBySearch;
    }

    async execute(){
        let type = await play.validate(this.url ?? 'https');
        if (type === 'yt_video'){
            let videoInfo = await play.video_basic_info(this.url);
            this.queue.push({
                index : this.queue.length + 1,
                name : (this.queue.length + 1) + '. ' + videoInfo?.video_details?.title,
                value : videoInfo?.video_details?.channel?.name ?? "No Info",
                url : this.url,
                played : MusicStatus.Waiting
            });
        } else if (type === 'yt_playlist'){
            let videoInfo = await play.playlist_info(this.url);
            console.log(videoInfo)
        } else if (this.url?.length < 2) {
            for (let i = 0; i < this.videoBySearch.length; i++) {
                if (this.url === this.videoBySearch[i].index.toString()) {
                    this.queue.push({
                        index : this.queue.length + 1,
                        name : this.videoBySearch[i].name,
                        value : this.videoBySearch[i].value,
                        url : this.videoBySearch[i].url,
                        played : MusicStatus.Waiting
                    });
                    this.message.channel.send('Added to queue, Jan lupa bayar');
                    return true;
                }
            }
        } else if (!this.url) {
         if (this.queue.length > 0) {
             return true;
            }
            this.message.channel.send('Lagu nya gaje cok, Gak nemu aku');
            return false;
        } else if (!type){
            this.message.channel.send('Link Tak Valid');
            return false;
        }

        this.message.channel.send('Added to queue, Jan lupa bayar');
        return true;
    }
}