import { Document } from './Document';
import { IContentSection } from './ContentSection';
import { IBibleCrossReference } from './BibleCrossReference';

export interface IBibleSection extends IContentSection {
    versionId: number;
    phraseStartId: number;
    phraseEndId: number;
    level: number;
    description?: Document;
    crossReferences?: IBibleCrossReference[];
}
