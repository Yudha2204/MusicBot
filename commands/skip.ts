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
            let index = this.server.queue.findIndex(x => x.status == MusicStatus.Next || x.status == MusicStatus.Unplayed)
            let queueLeft = this.server.queue.filter(x => x.status == MusicStatus.Next || x.status == MusicStatus.Unplayed).length
            if (skip > queueLeft) {
                this.message.channel.send('Cannot Skip, The Number Is Bigger Than Queue Left');
            } else {
                let tempSkip = skip;
                while (skip != 0) {
                    this.server.queue[index].status = MusicStatus.Skipped;
                    skip--
                    index++

                    if (skip == 0) {
                        this.message.channel.send(`Skipping ${tempSkip} Song`);
                        let play = new Play(this.message, this.server);
                        await play.execute();
                    }
                }

            }
        }
    }
}