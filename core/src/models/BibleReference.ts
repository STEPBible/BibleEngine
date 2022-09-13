export interface IBibleReferenceNormalizedNumbers {
    normalizedChapterNum?: number;
    normalizedVerseNum?: number;
    normalizedSubverseNum?: number;
}

export interface IBibleReferenceVersionNumbers {
    versionChapterNum?: number;
    versionVerseNum?: number;
    versionSubverseNum?: number;
}

export interface IBibleReferenceBase extends IBibleReferenceNormalizedNumbers {
    bookOsisId: string;
    versionId?: number;
    // we add the null value here so that we are able to define the value in cases when we force
    // all properties to be defined (like in BiblePhraseRef)
    versionUid?: string | null;
}

export interface IBiblePhraseRef
    extends Pick<IBibleReferenceBase, Exclude<keyof IBibleReferenceBase, 'versionUid'>> {
    phraseNum?: number;
    isNormalized: true;
}

export interface IBibleReference extends IBibleReferenceBase, IBibleReferenceVersionNumbers {
    /**
     * we need this property to enable checking for normalization on the TypeScript level, i.e. not
     * only during runtime. During runtime we check for normalization via isReferenceNormalized() -
     * this allows us work with objects that have the property not set (e.g. because it was stripped
     * to save space for transmission) and re-set the flag
     */
    isNormalized?: boolean;
    partIndicator?: string;
}

/**
 * we have this somewhat redundant way of structuring a range (compared to having two separate
 * reference objects in the range), so that we can use a reference as a range and vice-versa
 */
export interface IBibleReferenceRange extends IBibleReference {
    normalizedChapterEndNum?: number;
    normalizedVerseEndNum?: number;
    normalizedSubverseEndNum?: number;
    versionChapterEndNum?: number;
    versionVerseEndNum?: number;
    versionSubverseEndNum?: number;
    partIndicatorEnd?: string;
}

export interface IBibleReferenceNormalized extends IBibleReference {
    // force `isNormalized` to be "true"
    isNormalized: true;
}

export interface IBibleReferenceVersion extends IBibleReference {
    // force `versionId` to be defined
    // RADAR: it should also be possible to satisfy this condition if versionUid is defined
    //        however we don't know how to express this either-or condition in typescript
    versionId: number;
}

export interface IBibleReferenceVersionNormalized extends IBibleReferenceVersion {
    // force `isNormalized` to be "true"
    isNormalized: true;
}

export interface IBibleReferenceRangeNormalized extends IBibleReferenceRange {
    // force `isNormalized` to be "true"
    isNormalized: true;
}

export interface IBibleReferenceRangeVersion extends IBibleReferenceRange {
    // force `versionId` to be defined
    versionId: number;
}

export interface IBibleReferenceRangeVersionNormalized extends IBibleReferenceRangeVersion {
    // force `isNormalized` to be "true"
    isNormalized: true;
}

export interface IBibleReferenceRangeQuery extends IBibleReferenceRange {
    /** we don't allow versionId in a query since it local and remote ids are not the same */
    versionId?: undefined;
    versionUid: string;
    // TODO: implement
    targetVersionUid?: string;
    /**
     * there is a special case of `startingSections` that start at the beginning of the range and
     * end after it. So they both start in the range and wrap it and also extend after the
     * range. In a reader/context view we want to show all sections that start in a given range
     * (in a reader that will usually be a chapter range). However in a verse-reference popup we
     * probably don't want to show it, e.g. when showing Ps 1:1, we are only interested in the verse
     * not in the headings "Book One" and "The Way of the Righteous and the Wicked". However when
     * showing Ps 1 (the chapter) we would show the latter (not the former), since this section is
     * wrapping but not partial, i.e. it is identical to the range (so the heading is meaningful
     * also in the context of a popup)
     */
    skipPartialWrappingSectionsInDocument?: boolean;
}

/* types / interfaces needed for bible-passage-reference-parser */
export type BibleReferenceBCV = {
    b: 'string';
    c: number;
    v: number;
    type: 'integer' | 'bc' | 'c' | 'bcv' | 'cv' | 'v' | 'bv';
};

export type BibleReferenceParsedEntity = {
    osis: string;
    type: 'range' | 'integer' | 'bc' | 'c' | 'bcv' | 'cv' | 'v' | 'bv';
    indices: [number, number];
    start: BibleReferenceBCV;
    end: BibleReferenceBCV;
    valid?: { valid: boolean };
    entities?: BibleReferenceParsedEntity[];
};

export interface BibleReferenceParser {
    parse: (text: string) => BibleReferenceParserResult;
    parse_with_context: (text: string, context: string) => BibleReferenceParserResult;
    set_options: (options: {
        punctuation_strategy?: 'eu' | 'us';
        invalid_passage_strategy?: 'include' | 'ignore';
        invalid_sequence_strategy?: 'include' | 'ignore';
        passage_existence_strategy?: 'b' | 'bc' | 'bcv' | 'bv' | 'c' | 'cv' | 'v' | 'none';
        consecutive_combination_strategy: 'separate' | 'combine';
    }) => void;
}

export interface BibleReferenceParserResult {
    parsed_entities: () => { entities: BibleReferenceParsedEntity[] }[];
}
