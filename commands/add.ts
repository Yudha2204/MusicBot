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

    async execute(songs: Song[], u?: string | null) {
        if (!u) {
            this.message.channel.send('Please Add Second Argument');
        } else if (Number(u)) {
            this.queue.push(...songs.filter(x => x.index === Number(u)));
            this.message.channel.send('New Queue Added');
        } else {
            let type = await playDl.validate(u);
            if (type) {
                let info = await playDl.video_basic_info(u);
                this.queue.push({
                    index: this.queue.length + 1,
                    name: info.video_details.title ?? '',
                    value: info.video_details.channel?.name ?? '',
                    url: u,
                    status: MusicStatus.Unplayed
                });
            this.message.channel.send('New Queue Added');
            } else {
                this.message.channel.send('Link Not Valid, Link Supported (Youtube, Spotify, and SoundCloud)');
            }
        }
        this.fixIndexQueue();
    }

    private fixIndexQueue() {
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i].index = i;
        }
    }
}