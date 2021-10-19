import { Message } from "discord.js";
import { Server } from "../interface/server";
import { MusicStatus, Song } from "../interface/song";
import { Play } from "./play";

export class Skip {
    private message : Message;
    private server: Server;

    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    async execute(skip?: number | null) {
        if (skip) {
            let filterQueue: Song[] = this.server.queue.filter((x: Song) => x.status === MusicStatus.Unplayed);
            if (skip > filterQueue.length) {
                this.message.channel.send('Cannot Skip, The Number Is Bigger Than Queue Left');
            } else {
                for (let i = 0; i < skip; i++) {
                    filterQueue[i].status = MusicStatus.Skipped;
                }
                this.message.channel.send(`Skipping ${skip} Song`);
                let play = new Play(this.message, this.server);
                await play.execute();
            }
        }
    }
}