import { IBibleReferenceRange } from '.';
import { IContentSection } from './ContentSection';
import { IContentGroup, ContentGroupType } from './ContentGroup';
import { IContentPhrase } from './ContentPhrase';

export interface DocumentPhrase extends IContentPhrase {
    readonly type: 'phrase';
    bibleReference?: IBibleReferenceRange;
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
