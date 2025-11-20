import { IBibleReferenceRangeQuery } from './BibleReference.js';
import { ContentGroupType, IContentGroup } from './ContentGroup.js';
import { IContentPhrase } from './ContentPhrase.js';
import { IContentSection } from './ContentSection.js';

export interface DocumentPhrase extends IContentPhrase {
    readonly type?: 'phrase';
    bibleReference?: IBibleReferenceRangeQuery;
}

export interface DocumentGroup<T extends ContentGroupType> extends IContentGroup<T> {
    readonly type: 'group';
    readonly groupType: T;
    contents: (DocumentGroup<ContentGroupType> | DocumentPhrase)[];
}

export interface DocumentSection extends IContentSection {
    readonly type: 'section';
    contents: DocumentElement[];
}

export type DocumentRoot = {
    readonly type: 'root';
    contents: DocumentElement[];
};

export type DocumentElement = DocumentSection | DocumentGroup<ContentGroupType> | DocumentPhrase;
