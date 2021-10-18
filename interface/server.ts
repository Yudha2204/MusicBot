import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { Song } from "./song";

export class Server {
    queue : Song[] = [];
    channel : VoiceConnection | null = null;
    player : AudioPlayer | null = null;
    status : 'active' | 'inactive' = 'active';
    serverName : string | undefined; 
    timeStamp: Date = new Date();

    constructor (name? : string) {
        this.serverName = name;
    }
}
