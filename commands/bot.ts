import { Message, MessageEmbed } from "discord.js";

export function sendCommandInfo(message: Message) {
    let pic = 'https://lh3.googleusercontent.com/ogw/ADea4I4RMxkL1oEULYQ_hq46GyYA-NK3y8pRkHoMtpqv=s83-c-mo';
    message.channel.send({
        embeds: [
            new MessageEmbed()
                .setColor("#04eded")
                .setTitle('Command Info')
                .setThumbnail(pic)
                .addFields(
                    {
                        name: 'Info',
                        value: 'Show All Command List'
                    },
                    {
                        name: 'Playlist',
                        value: 'Show All Server Playlist'
                    },
                    {
                        name: 'Playlist PlaylistName',
                        value: 'Show All Song In Playlist'
                    },
                    {
                        name: 'Playlist Play PlaylistName',
                        value: 'Play Song From Playlist'
                    },
                    {
                        name: 'Playlist Add (Song Url | Number) PlaylistName',
                        value: 'Add New Song Into Your Playlist'
                    },
                    {
                        name: 'Playlist Save PlaylistName',
                        value: 'Save Queue To Server Playlist'
                    },
                    {
                        name: 'Play | (Number / Url) (Optional)',
                        value: 'Play A Music If There a Queue, Or Add Song Then Play It'
                    },
                    {
                        name: 'Skip (Number)',
                        value: 'Skip Queue To Next Song'
                    },
                    {
                        name: 'Pause',
                        value: 'Pause Current Music',
                        inline: true
                    },
                    {
                        name: 'Resume',
                        value: 'Resume Current Music',
                        inline: true
                    },
                    {
                        name: 'Queue',
                        value: 'Show Unplayed Song Only',
                        inline: true
                    },
                    {
                        name: 'Loop',
                        value: 'Looping Current Queue',
                    },
                    {
                        name: 'Add (Url Or Number)',
                        value: 'Add Song Into Queue'
                    },
                    {
                        name: 'Exit',
                        value: 'Please Use This, If You No Longer Listen To A Music With This Bot'
                    })
                .setFooter('Prefix (-) Thanks For Using This Bot', pic)
        ]
    })
}


export function sendToMember(msg: Message, count: number) {
    msg.member?.send({
        embeds: [
            new MessageEmbed()
                .setTitle('Server That Using This Bot')
                .addFields(
                    { name: 'Servers Active', value: count.toString() }
                )
                .setTimestamp(new Date())
        ]
    });
}

export function sendNews(message: Message) {
    let pic = 'https://lh3.googleusercontent.com/ogw/ADea4I4RMxkL1oEULYQ_hq46GyYA-NK3y8pRkHoMtpqv=s83-c-mo';
    message.channel.send({
        embeds: [
            new MessageEmbed()
                .setColor("#04eded")
                .setTitle('News Update')
                .setThumbnail(pic)
                .addFields(
                    {
                        name: 'Bot Version 0.2.3',
                        value: 'Fix Bug Skip Command'
                    })
                .setFooter('Prefix (-) Thanks For Using This Bot', pic)
        ]
    })
}