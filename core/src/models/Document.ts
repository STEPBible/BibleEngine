import { IBibleReferenceRangeNormalized } from '.';
import { IContentSection } from './ContentSection';
import { IContentGroup } from './ContentGroup';
import { IContentPhrase } from './ContentPhrase';

export interface DocumentPhrase extends IContentPhrase {
    readonly type: 'phrase';
    bibleReference?: IBibleReferenceRangeNormalized;
}

export interface DocumentGroup extends IContentGroup {
    readonly type: 'group';
    contents: (DocumentGroup | DocumentPhrase)[];
}

export interface DocumentSection extends IContentSection {
    readonly type: 'section';
    contents: (DocumentSection | DocumentGroup | DocumentPhrase)[];
}

export type DocumentDefault = (DocumentSection | DocumentGroup | DocumentPhrase)[];
