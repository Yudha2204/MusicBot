import { MessageEmbed, TextBasedChannel } from "discord.js";
import { MusicStatus, Song } from "../interface/song";

export class Queue {
    private channel: TextBasedChannel;
    private queue: Song[];

    constructor(channel: TextBasedChannel, queue: Song[]) {
        this.channel = channel;
        this.queue = queue;
    }

    async execute(secondCommand?: string) {
        if (secondCommand === 'reset') {
            this.resetQueue();
        } else {
            this.getQueueList();
        }
    }

    private getQueueList() {
        let filter = this.queue.map(x => {
            return { ...x, name: `${x.index}. ${x.name}`, value: `${x.value} (${x.status})` }
        })
        if (filter.length > 0) {
            this.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#fffff')
                        .setTitle('Queue')
                        .addFields(...filter)
                ]
            });
        } else {
            this.channel.send('There No Song In Queue');
        }
    }

    private resetQueue() {
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i].status = MusicStatus.Unplayed;
        }
        this.channel.send('Queue Reset, Type -Play To Play Queue');
    }
}