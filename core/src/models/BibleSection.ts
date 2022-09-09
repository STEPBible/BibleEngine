import { IBibleCrossReference } from './BibleCrossReference';
import { IContentSection } from './ContentSection';
import { DocumentRoot } from './Document';

export interface IBibleSectionGeneric {
    phraseStartId: number;
    phraseEndId: number;
}

export interface IBibleSectionBase extends IContentSection {
    description?: DocumentRoot;
    crossReferences?: IBibleCrossReference[];
    isChapterLabel?: boolean;
}

export interface IBibleSection extends IBibleSectionGeneric, IBibleSectionBase {}

export interface IBibleSectionEntity extends IBibleSection {
    versionId: number;
    level: number;
}
