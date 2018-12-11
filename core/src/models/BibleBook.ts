import { Document } from './Document';

export interface IBibleBook {
    versionId: number;
    type: 'ot' | 'nt' | 'ap';
    osisId: string;
    abbreviation: string;
    number: number;
    title: string;
    chaptersCount?: number[];
    introduction?: Document;
}
