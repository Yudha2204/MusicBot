export interface Song{
    index : number;
    name : string;
    value : string;
    url : string;
    status : MusicStatus;
}

export enum MusicStatus {
    Playing = 'Now Playing',
    Skipped = 'Skipped',
    Done = 'Sudah Diputar',
    Unplayed = 'Unplayed'
}