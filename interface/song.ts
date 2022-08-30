export interface Song {
    name: string;
    value: string;
    url: string;
    status: MusicStatus;
}

export enum MusicStatus {
    Playing = 'Now Playing',
    Skipped = 'Skipped',
    Done = 'Played',
    Unplayed = 'Unplayed',
    Next = 'Next'
}