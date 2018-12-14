import { Document } from './Document';
import { IContentSection } from './ContentSection';
import { IBibleCrossReference } from './BibleCrossReference';

export interface IBibleSectionGeneric {
    phraseStartId: number;
    phraseEndId: number;
}

export interface IBibleSectionBase extends IContentSection {
    description?: Document;
    crossReferences?: IBibleCrossReference[];
}

export interface IBibleSection extends IBibleSectionGeneric, IBibleSectionBase {}

export interface IBibleSectionEntity extends IBibleSection {
    versionId: number;
    level: number;
}
