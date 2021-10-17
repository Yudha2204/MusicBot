import { Message } from "discord.js";
import { Server } from "../interface/server";
import { MusicStatus, Song } from "../interface/song";
import { Play } from "./play";

export class Skip {
    private message : Message;
    private server : Server;
    private skip : number;

    constructor (message : Message, server : Server, skip : number) {
        this.message = message;
        this.server = server;
        this.skip = skip;
    }

    async execute() {
        let filterQueue : Song[] = this.server.queue.filter((x : Song) => x.status === MusicStatus.Waiting);
        for (let i = 0; i < this.skip; i++) {
            filterQueue[i].status = MusicStatus.Skipped;
        }
        this.message.channel.send(`Skipping ${this.skip} Song`);
        let play = new Play(this.message, this.server);
        await play.execute();
    }
}