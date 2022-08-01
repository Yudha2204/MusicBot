import { Message } from "discord.js";
import { Server } from "../interface/server";

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
        this.message.channel.send(`Removing ${this.server.queue[index].name} From Queue`)
        this.server.queue.splice(index, 1);
    }
}