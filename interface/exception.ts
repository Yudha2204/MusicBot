import { ColorResolvable, MessageEmbed } from "discord.js";

export class PlayerException extends Error {
    message!: string;
    color: ColorResolvable = 'RED';

    constructor(message: string, color?: ColorResolvable) {
        super(message);

        this.message = message;
        this.color = color ?? 'RED';
        Object.setPrototypeOf(this, PlayerException.prototype);
    }

    override toString() {
        return this.message;
    }

    toEmbed() {
        return new MessageEmbed().setColor(this.color).setTitle(this.message)
    }
}