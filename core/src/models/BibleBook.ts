import { DocumentRoot } from './Document';

export interface IBibleBook {
    versionId: number;
    type: 'ot' | 'nt' | 'ap';
    osisId: string;
    abbreviation: string;
    number: number;
    title: string;
    longTitle?: string;
    chaptersCount?: number[];
    introduction?: DocumentRoot;
}
