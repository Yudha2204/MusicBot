import { MusicStatus } from "../interface/song";
import { getDoc, getFirestore, getDocs, collection, doc, setDoc } from 'firebase/firestore/lite'
import { initializeApp } from 'firebase/app';

import { firebaseConfig } from "../config/firebase.config";
import { Play } from "./play";
import { EmbedFieldData, Message, MessageEmbed } from "discord.js";
import { Server } from "../interface/server";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class Playlist {
    private message : Message
    private server : Server;
    private args : string[];

    constructor (message : Message, server : Server, args : string[]) {
        this.message = message;
        this.server = server;
        this.args = args;
    }

    async execute(){
        if (this.args[0] === 'play' && this.args[1]){
            await this.play();
        } else if (this.args[0] === 'save' && this.args[1]){
            await this.savePlaylist();
        } else if (this.args[0]){
            await this.showPlaylistSong();
        } else {
            await this.getServerPlaylist();
        }
    } 

    private async play() {
        try {
            const dbColection = collection(db, `ServerPlaylist/${this.message.guildId}/Playlist/${this.args[1]}/Song`);
            const dbDocs = await getDocs(dbColection);
            for (let i = 0; i < dbDocs.docs.length; i++) {
                this.server.queue.push(
                    {
                        index: Number(dbDocs.docs[i].id),
                        name: dbDocs.docs[i].data().name,
                        value: dbDocs.docs[i].data().value,
                        url: dbDocs.docs[i].data().url,
                        status: MusicStatus.Unplayed
                    });
            }
            this.server.queue = this.server.queue.sort((a, b) => a.index - b.index);

            let playCommand = new Play(this.message, this.server);
            await playCommand.execute();
        } catch (err) {
            console.log('Play =>', err);
        }
    }

    private async savePlaylist(){
        try {
            this.message.channel.send('Saving Playlist, Please Wait :orange_circle:');
            const headCollection = collection(db, `ServerPlaylist`);
            await setDoc(doc(headCollection, this.message.guildId as string), {});
            const subCollection = collection(db, `ServerPlaylist/${this.message.guildId as string}/Playlist`);
            await setDoc(doc(subCollection, this.args[1]), {});
            const songCollection = collection(db, `ServerPlaylist/${this.message.guildId as string}/Playlist/${this.args[1]}/Song`);
            for (let i = 0; i < this.server.queue.length; i++) {
                const dbDocs = await getDocs(songCollection);
                await setDoc(doc(songCollection, dbDocs.size.toString()), {
                    name: this.server.queue[i].name, url: this.server.queue[i].url, value: this.server.queue[i].value
                });
            }
            this.message.channel.send(`Success Add Into Playlist :green_circle:`);
        } catch (err) {
            console.log('Save Playlist => ', err);
        }
    }

    private async getServerPlaylist() {
        try {
            this.message.channel.send('Please Wait Fetching Data :orange_circle:');
            const dbColection = collection(db, `ServerPlaylist/${this.message.guildId}/Playlist`);
            const dbDocs = await getDocs(dbColection);
            const playlist = dbDocs.docs.map(x => x.id);
            const embedMessage: EmbedFieldData[] = [];
    
            for (let i = 0; i < playlist.length; i++) {
                const dbColection = collection(db, `ServerPlaylist/${this.message.guildId}/Playlist/${playlist[i]}/Song`);
                const dbDocs = await getDocs(dbColection);
                embedMessage.push({ name: `${i+1}. ${playlist[i]}`, value: dbDocs.size + ' Song' });
            }
    
            this.message.channel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Playlist in this server')
                        .addFields(embedMessage)
                ]
            })
        } catch (err) {
            console.log('Error When Get A Playlist', err);
        }
    }

    private async showPlaylistSong() {
        try {
            const dbColection = collection(db, `ServerPlaylist/${this.message.guildId}/Playlist/${this.args[0]}/Song`);
            const dbDoc = await getDocs(dbColection);
            const embedMessage: EmbedFieldData[] = [];
            const docs = dbDoc.docs.sort((a, b) => Number(a.id) - Number(b.id));
            for (let i = 0; i < docs.length; i++) {
                embedMessage.push(
                    { name : docs[i].id + '. ' + docs[i].data().name, value : docs[i].data().value }
                )
            }
            if (embedMessage.length > 0) {
                this.message.channel.send({
                    embeds : [ 
                        new MessageEmbed()
                        .setTitle('Playlist ' + this.args[0])
                        .addFields(...embedMessage)
                    ]
                })
            } else {
                this.message.channel.send('Playlist Not Found, *Playlist name is case sensitive')
            }
            
        } catch (err) {
            console.log('Show Playlist =>', err);
        }
    }
}