import { Message, MessageEmbed } from "discord.js"
import { Video } from "../video.model";

export class QueueList{
    message : Message;
    queue : Video[] = []

    constructor (message : Message, queue : Video[]){
        this.message = message;
        this.queue = queue;
    }

    async execute(){
        if (this.queue.length > 0){
            this.message.channel.send({
                embeds : [
                    new MessageEmbed()
                    .setColor('#fffff')
                    .setTitle('Queue List')
                    .addFields(...this.queue)
                ]
            });
        } else {
            this.message.channel.send('Belum Ada List Queue Cok');
        }
    }
}