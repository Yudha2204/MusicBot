import { Message } from "discord.js";
import * as playDl from 'play-dl';
import { Server } from "../interface/server";
import { MusicStatus } from "../interface/song";
import { Play } from "./play";

export class Controls {
    private message: Message;
    private server: Server;

    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    async prev() {
        let index = this.server.queue.findIndex(x => x.status == MusicStatus.Playing || x.status == MusicStatus.Next || x.status == MusicStatus.Unplayed)
        if (index != 0) {
            this.server.queue[index - 1].status = MusicStatus.Unplayed
            this.server.queue[index].status = MusicStatus.Next
            this.server.queue[index + 1].status = MusicStatus.Unplayed
            let play = new Play(this.message, this.server);
            await play.execute();
        } else {
            this.message.channel.send('Cant Go Back')
        }
    }

    async next() {
        let index = this.server.queue.findIndex(x => x.status == MusicStatus.Playing || x.status == MusicStatus.Next || x.status == MusicStatus.Unplayed)
        if (index != this.server.queue.length - 1) {
            this.server.queue[index].status = MusicStatus.Done
            this.server.queue[index + 1].status = MusicStatus.Unplayed
            if (this.server.queue.length - index + 1 != 0)
                this.server.queue[index + 1].status = MusicStatus.Next
            let play = new Play(this.message, this.server);
            await play.execute();
        } else {
            this.message.channel.send('Cant Go Forward')
        }
    }
}