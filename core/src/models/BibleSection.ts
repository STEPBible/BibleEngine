import { Document } from './Document';
import { IContentSection } from './ContentSection';
import { IBibleCrossReference } from './BibleCrossReference';

export interface IBibleSectionBase extends IContentSection {
    description?: Document;
    crossReferences?: IBibleCrossReference[];
}

export interface IBibleSection extends IBibleSectionBase {
    versionId: number;
    phraseStartId: number;
    phraseEndId: number;
    level: number;
}
