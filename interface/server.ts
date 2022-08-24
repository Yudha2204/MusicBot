import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { TextChannel } from "discord.js";
import { Song } from "./song";

export class Server {
    queue: Song[] = [];
    channel: VoiceConnection | null = null;
    player: AudioPlayer | null = null;
    status: 'active' | 'inactive' = 'active';
    playlistName: string = "None";
    timeStamp: Date = new Date();
    loop: boolean = false;
    paused: boolean = false;
    messageId: string | undefined = undefined;
    channelControl: TextChannel | undefined = undefined;
}
