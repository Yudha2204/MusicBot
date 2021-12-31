import { Message } from "discord.js";
import * as playDl from 'play-dl';
import { MusicStatus, Song } from "../interface/song";

export class AddQueue {
    private message: Message;
    private queue: Song[];

    constructor(message: Message, queue: Song[]) {
        this.message = message;
        this.queue = queue;
    }

    async execute(songs: Song[], url?: string | null) {
        try {
            if (!url) {
                this.message.channel.send('Please Add Second Argument');
            } else if (Number(url)) {
                let song = songs.filter(x => x.index === Number(url)).map(x => {
                    return { ...x, index: this.queue.length, value: `${x.name.slice(3)}` };
                })
                this.queue.push(...song);
                this.message.channel.send('New Queue Added');
            } else {
                let type = await playDl.validate(url).catch(err => console.log(err));
                if (type) {
                    let info = await playDl.video_basic_info(url);
                    this.queue.push({
                        index: this.queue.length + 1,
                        name: this.queue.length + 1 + '. ' + info.video_details.title ?? '',
                        value: info.video_details.channel?.name ?? '',
                        url: url,
                        status: MusicStatus.Unplayed
                    });
                    this.message.channel.send('New Queue Added');
                } else {
                    this.message.channel.send('Link Not Valid, Link Supported (Youtube, Spotify, and SoundCloud)');
                }
            }
        } catch (err) {
            console.log('Add Command Error', err)
        }
        // this.fixIndexQueue();
    }

    // private fixIndexQueue() {
    //     for (let i = 0; i < this.queue.length; i++) {
    //         this.queue[i].index = i;
    //     }
    // }
}