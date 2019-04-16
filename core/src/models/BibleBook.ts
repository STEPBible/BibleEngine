import { DocumentRoot } from './Document';

export interface IBibleBook {
    type: 'ot' | 'nt' | 'ap';
    osisId: string;
    abbreviation: string;
    number: number;
    title: string;
    longTitle?: string;
    chaptersCount?: number[];
    introduction?: DocumentRoot;
    dataLocation?: 'db' | 'importing' | 'file' | 'remote';
}

export interface IBibleBookEntity extends IBibleBook {
    versionId: number;
}
