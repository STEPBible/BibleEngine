import { BibleInput } from '.';

export interface IBibleBook {
    versionId: number;

    osisId: string;

    number: number;

    title: string;

    type: 'ot' | 'nt' | 'ap';
}

export interface IBibleBookWithContent extends IBibleBook {
    content: BibleInput;
}
