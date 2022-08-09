import { Message } from "discord.js";
import { Server } from "../interface/server";
import { MusicStatus } from "../interface/song";

export class Remove {
    private message: Message;
    private server: Server;
    constructor(message: Message, server: Server) {
        this.message = message;
        this.server = server;
    }

    execute(index: number) {
        if (!index) {
            return this.message.channel.send('Please add second argument')
        }

        if (this.server.queue[index - 1].status == MusicStatus.Playing) {
            return this.message.channel.send('Cannot remove queue when music is playing')
        }

        this.message.channel.send(`Removing ${this.server.queue[index - 1].name} From Queue`)
        this.server.queue.splice(index - 1, 1);
    }
}