import { Document } from './Document';
import { IContentSection } from './ContentSection';
import { IBibleCrossReference } from './BibleCrossReference';

export interface IBibleSectionInput extends IContentSection {
    description?: Document;
    crossReferences?: IBibleCrossReference[];
}

export interface IBibleSection extends IBibleSectionInput {
    versionId: number;
    phraseStartId: number;
    phraseEndId: number;
    level: number;
}
