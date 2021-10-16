export interface Video{
    index : number;
    name : string;
    value : string;
    url : string;
    played : MusicStatus;
}

export enum MusicStatus {
    Playing = 'Now Playing',
    Done = 'Sudah Diputar',
    Waiting = 'Waiting'
}