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
    skipPartialSectionsInDocument?: boolean;
}

/* types / interfaces neded for bible-passage-reference-parser */
export type BibleReferenceBCV = {
    b: 'string';
    c: number;
    v: number;
    type: 'integer' | 'bc' | 'c' | 'bcv' | 'cv' | 'v';
};

export type BibleReferenceParsedEntity = {
    osis: string;
    type: 'range' | 'integer' | 'bc' | 'c' | 'bcv' | 'cv' | 'v';
    indices: [number, number];
    start: BibleReferenceBCV;
    end: BibleReferenceBCV;
};

export interface BibleReferenceParser {
    parse: (text: string) => BibleReferenceParserResult;
    parse_with_context: (text: string, context: string) => BibleReferenceParserResult;
    set_options: (options: {
        punctuation_strategy?: 'eu' | 'us';
        invalid_passage_strategy?: 'include' | 'ignore';
        invalid_sequence_strategy?: 'include' | 'ignore';
        passage_existence_strategy?: 'b' | 'bc' | 'bcv' | 'bv' | 'c' | 'cv' | 'v' | 'none';
    }) => void;
}

export interface BibleReferenceParserResult {
    parsed_entities: () => { entities: BibleReferenceParsedEntity[] }[];
}
