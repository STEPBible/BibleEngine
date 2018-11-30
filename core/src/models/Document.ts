import { IBibleReferenceRangeNormalized } from '.';
import { IContentSection } from './ContentSection';
import { IContentGroup } from './ContentGroup';
import { IContentPhrase } from './ContentPhrase';

export interface DocumentPhrase extends IContentPhrase {
    bibleReference?: IBibleReferenceRangeNormalized;
}

export interface DocumentGroup extends IContentGroup {
    contents: (DocumentGroup | DocumentPhrase)[];
}

export interface DocumentSection extends IContentSection {
    contents: (DocumentSection | DocumentGroup | DocumentPhrase)[];
}

export type Document = (DocumentSection | DocumentGroup | DocumentPhrase)[];
