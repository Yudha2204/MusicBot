export interface Song {
    no: number;
    name: string;
    value: string;
    url: string;
    status: MusicStatus;
}

export enum MusicStatus {
    Playing = 'Now Playing',
    Skipped = 'Skipped',
    Played = 'Played',
    Unplayed = 'Unplayed',
    Next = 'Next'
}