import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { Song } from "./song";

export interface Server {
    queue : Song[],
    channel : VoiceConnection | null,
    player : AudioPlayer | null
    status : 'active' | 'inactive'
}
