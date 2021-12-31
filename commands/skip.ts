import { Message } from "discord.js";
import { Server } from "../interface/server";
import { MusicStatus, Song } from "../interface/song";
import { Play } from "./play";

export class Skip {
    private message: Message;
    private server: Server;

    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    async execute(skip: number = 1) {
        if (skip) {
            let nowPlaying = this.server.queue.findIndex((x: Song) => x.status === MusicStatus.Next);

            if (skip > this.server.queue.length) {
                this.message.channel.send('Cannot Skip, The Number Is Bigger Than Queue Left');
            } else {
                for (let i = 0; i < skip - 1; i++) {
                    this.server.queue[nowPlaying + i].status = MusicStatus.Skipped;
                    if (i == skip) {
                        this.server.queue[nowPlaying + i + 1].status = MusicStatus.Next;
                    }
                }
                this.message.channel.send(`Skipping ${skip} Song`);
                let play = new Play(this.message, this.server);
                await play.execute();
            }
        }
    }
}