import {
    BibleReferenceParsedEntity,
    BibleReferenceParser,
    BOOK_DATA,
    DocumentPhrase,
    getNormalizedVerseCount,
    IBibleReferenceRangeQuery,
    NT_BOOKS,
    OT_BOOKS,
} from '@bible-engine/core';
import { IContentPhrase } from '@bible-engine/core/lib/models/ContentPhrase';
import { ImporterBookMetadata } from './Importer.interface';

// we need to be careful with interpreting quotation marks, since german uses a 99-66 pattern, while
// other languages use 66-99. However since the german starting marks are at the bottom, the two
// "99"s can be distinguished (see further comments below).
//
// Additionally the characters "«" and "»" are used oppositely in different languages, wo we also
// put them in the "other" category.

const PUNCTUATION_NO_SPACE_BEFORE = [
    // latin
    '.',
    ',',
    ':',
    '?',
    '!',
    ';',
    ')',
    ']',
    // non-german ending quotation marks (which can be used since the german starting quotation marks are at the bottom)
    '’',
    '”',
    // we can't add german ending quotation marks here (“ or ‘), because the same character is used
    // in english for starting quotes
    //
    // arabic
    'و',
    // chinese
    '；',
    '，',
    '。',
    '、',
    '：',
    '！',
];

const PUNCTUATION_NO_SPACE_AFTER = [
    // we can't add starting quotation marks here (“ or ‘), because the same character is used for
    // closing quotation marks in german
    '(',
    '[',
    '╵',
    // german starting quotation marks
    '„',
    '‚',
];

const PUNCTUATION_OTHER = ['–', '-', "'", '"', '«', '»', '‹', '›', '“', '‘', '‟', '‛'];

const PUNCTUATION_CHARS = [
    ...PUNCTUATION_NO_SPACE_BEFORE,
    ...PUNCTUATION_NO_SPACE_AFTER,
    ...PUNCTUATION_OTHER,
];

// list of words in different languages that are equivalent to "cf." (compare) / "see" / "also"
// (this list is used to convert notes that essentially contain only cross-references into actual
// cross-references)
const CROSS_REFERENCE_WORDS = [
    'cf.',
    'cf',
    'compare',
    'see',
    'also',
    'see also',
    'siehe',
    'auch',
    'siehe auch',
    'vgl',
    'vgl.',
    'voir',
    'voir aussi',
    'comparer',
];

/**
 * determines if the string starts with a character that (usually) doesn't have a space before of it
 */
export function startsWithNoSpaceBeforeChar(string: string) {
    return PUNCTUATION_NO_SPACE_BEFORE.indexOf(string.trim().slice(0, 1)) !== -1;
}

/**
 * determines if the string ends with a character that (usually) doesn't have a space after of it
 */
export function endsWithNoSpaceAfterChar(string: string) {
    return PUNCTUATION_NO_SPACE_AFTER.indexOf(string.trim().slice(-1)) !== -1;
}

/**
 * determines if the string consists only of a punctuation character
 */
export function isOnlyPunctuationChar(string: string) {
    return PUNCTUATION_CHARS.indexOf(string.trim()) !== -1;
}

/**
 * determines if the string contains only of words that are pointing to cross-references (e.g.
 * "cf." or "see") or just punctuation (i.e. there is no actual content besides the references)
 */
export function isOnlyCrossReferenceWordOrPunctuation(string: string) {
    return (
        CROSS_REFERENCE_WORDS.indexOf(string.trim().toLowerCase()) !== -1 ||
        isOnlyPunctuationChar(string)
    );
}

export function matchAll(string: string, regexp: RegExp) {
    if (typeof string !== 'string') {
        return null;
    }
    const matches: RegExpMatchArray[] = [];
    string.replace(regexp, function () {
        const arr: any = [].slice.call(arguments, 0);
        const extras = arr.splice(-2);
        arr.index = extras[0];
        arr.input = extras[1];
        matches.push(arr);
        return arr[0];
    });
    return matches.length ? matches : null;
}

export function streamToString(stream: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((_resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => _resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

export const getImporterBookMetadata = (lang: string): ImporterBookMetadata => {
    const books = [...OT_BOOKS, ...NT_BOOKS];
    const importerBookMetadata: ImporterBookMetadata = new Map();
    for (const osisId of books) {
        if (!BOOK_DATA[osisId]) throw new Error(``);
        importerBookMetadata.set(osisId, {
            abbreviation: osisId,
            number: BOOK_DATA[osisId]!.genericId,
            title: BOOK_DATA[osisId]!.names[lang]?.[0] || osisId,
        });
    }
    return importerBookMetadata;
};

export const getBibleReferenceFromParsedReference = (
    ref: BibleReferenceParsedEntity,
    versionUid: string
) => {
    const bibleReference: IBibleReferenceRangeQuery = {
        bookOsisId: ref.start.b,
        versionUid: versionUid,
        versionChapterNum: ref.start.c,
    };
    if (
        ref.type === 'v' ||
        ref.type === 'cv' ||
        ref.type === 'bcv' ||
        ref.type === 'integer' ||
        (ref.type === 'range' && ref.start.type !== 'c' && ref.start.type !== 'bc')
    ) {
        bibleReference.versionVerseNum = ref.start.v;
        if (ref.start.v !== ref.end.v || ref.start.c !== ref.end.c) {
            bibleReference.versionVerseEndNum =
                ref.end.v === 999
                    ? getNormalizedVerseCount(ref.start.b, ref.end.c || ref.start.c)
                    : ref.end.v;
        }
    }
    if (ref.start.c !== ref.end.c) {
        bibleReference.versionChapterEndNum = ref.end.c;
    }
    return bibleReference;
};

export const getPhrasesFromParsedReferences = (
    text: string,
    parsedRefs: BibleReferenceParsedEntity[],
    versionUid: string
) => {
    const phrases: IContentPhrase[] = [];

    // sort reference by starting indices
    parsedRefs.sort((a, b) => a.indices[0] - b.indices[0]);

    let currentIndex = 0;
    for (const ref of parsedRefs) {
        const refText = text.slice(ref.indices[0], ref.indices[1]).trim();

        if (currentIndex > ref.indices[0])
            throw new Error(
                `reference entities overlap in text ${text} with refText ${refText} ` +
                    `between currentIndex ${currentIndex} and indices[0] ` +
                    `${ref.indices[0]}`
            );

        if (currentIndex < ref.indices[0]) {
            // create phrase from text at range currentIndex to start of reference
            const fillText = text.slice(currentIndex, ref.indices[0]).trim();
            if (fillText) {
                const fillPhrase: DocumentPhrase = {
                    type: 'phrase',
                    content: fillText,
                };
                if (startsWithNoSpaceBeforeChar(fillText)) fillPhrase.skipSpace = 'before';
                if (endsWithNoSpaceAfterChar(fillText))
                    fillPhrase.skipSpace = fillPhrase.skipSpace === 'before' ? 'both' : 'after';
                phrases.push(fillPhrase);
            }
        }

        // create phrase from reference with crossRef attached to it
        //
        // This is reference is "hard-coded" into the serialized document in the DB, and
        // we can only use the version numbmers here (normalization is not available at
        // this point). In order to be able to use this data across installations (e.g.
        // in a client-server use-case), we use the universal versionUid instead of
        // versionId.
        const bibleReference = getBibleReferenceFromParsedReference(ref, versionUid);
        const refPhrase: DocumentPhrase = {
            type: 'phrase',
            content: refText,
            bibleReference,
        };
        if (startsWithNoSpaceBeforeChar(refText)) refPhrase.skipSpace = 'before';
        if (endsWithNoSpaceAfterChar(refText))
            refPhrase.skipSpace = refPhrase.skipSpace === 'before' ? 'both' : 'after';
        phrases.push(refPhrase);

        currentIndex = ref.indices[1];
    }

    if (currentIndex <= text.length - 1) {
        // create phrase from text after last reference
        const endText = text.slice(currentIndex).trim();
        if (endText) {
            const endPhrase: DocumentPhrase = {
                type: 'phrase',
                content: endText,
            };
            if (startsWithNoSpaceBeforeChar(endText)) endPhrase.skipSpace = 'before';
            if (endsWithNoSpaceAfterChar(endText))
                endPhrase.skipSpace = endPhrase.skipSpace === 'before' ? 'both' : 'after';
            phrases.push(endPhrase);
        }
    }
    return phrases;
};

/**
 * returns all bible references within the given text
 */
export const getReferencesFromText = (
    /** parser that needs to be configured to the language of `text` */
    parser: BibleReferenceParser,
    text: string,
    context?: {
        bookOsisId: string;
        chapterNum?: number;
        language?: string;
        localRefMatcher?: RegExp;
    },
    keepInvalidRefs = true,
    invalidRefsCallback?: (
        fullText: string,
        refText: string,
        parsedRef: BibleReferenceParsedEntity
    ) => void
) => {
    const entities: BibleReferenceParsedEntity[] = [];

    const contextOsisString = !context
        ? ''
        : context.chapterNum
        ? `${context.bookOsisId} ${context.chapterNum}`
        : context.bookOsisId;

    //  BCV parser does only detect local refs at the beginning of the string. This additional
    //  regex can be provided to help the parser find all of them
    //  example (german): `/(Kapitel|V\.|Vers) ([0-9,.\-; ]|(und|bis|Kapitel|V\.|Vers))+/g`
    // normalize language to consist of only two letters and lowercase if it is defined, otherwise leave it undefined
    const languageNormalized = context?.language?.toLowerCase().substring(0, 2);
    const localRefMatcher: RegExp | undefined = context?.localRefMatcher
        ? context.localRefMatcher
        : languageNormalized === 'en'
        ? /(^|\s)(chapter|ch\.|v\.|verse|verses)\s([0-9,:\-–;\s]|(and|to|chapter|ch\.|v\.|verse|verses))+/gi
        : languageNormalized === 'de'
        ? /(Kapitel|V\.|Vers)\s([0-9,\.\-–;\s]|(und|bis|Kapitel|V\.|Vers))+/g
        : languageNormalized === 'fr'
        ? /(chapitre|ch\.|v\.|verset|versets)\s([0-9,\.\-–;\s]|(et|chapitre|ch\.|v\.|verset|versets))+/gi
        : /(c\.|ch\.|v\.|vs)\s([0-9,\.:\-–;\s]|(c\.|ch\.|v\.|vs))+/gi;

    if (context && localRefMatcher) {
        // since for some reason the BCV parser does only match local/context-refs at the beginning
        // of the string/text, we detect them manually in a first run
        const localRefs = text.match(localRefMatcher);
        if (localRefs) {
            let lastRefIndex = 0;
            for (const localRef of localRefs) {
                const parsedLocalEntities = parser
                    .parse_with_context(localRef, contextOsisString)
                    .parsed_entities();
                if (parsedLocalEntities[0]) {
                    // we need to make sure to only search from where we last stopped in case
                    // a reference occurs multiple times in the search-string
                    const localRefIndex = text.indexOf(localRef, lastRefIndex);

                    for (const entity of <BibleReferenceParsedEntity[]>(
                        parsedLocalEntities[0].entities
                    )) {
                        // we set `lastRefIndex` to the last index of the last entity in `localRef`
                        lastRefIndex = entity.indices[1] + localRefIndex;
                        entities.push({
                            ...entity,
                            indices: [
                                entity.indices[0] + localRefIndex,
                                entity.indices[1] + localRefIndex,
                            ],
                        });
                    }
                }
            }
        }
    }

    const parsedEntities =
        context && !localRefMatcher
            ? parser.parse_with_context(text, contextOsisString).parsed_entities()
            : parser.parse(text).parsed_entities();

    for (const parsedEntity of parsedEntities) {
        outer_loop: for (const entity of <BibleReferenceParsedEntity[]>parsedEntity.entities) {
            if (context && localRefMatcher) {
                let isEntityAlreadyMatched = false;
                // make sure we don't match a reference that we already did within localRefs
                for (const existingEntity of entities) {
                    if (
                        existingEntity.indices[0] === entity.indices[0] ||
                        existingEntity.indices[1] === entity.indices[1]
                    ) {
                        isEntityAlreadyMatched = true;
                        break;
                    }
                }
                if (isEntityAlreadyMatched) continue;
            }

            if (
                !keepInvalidRefs &&
                ((entity.valid && !entity.valid.valid) ||
                    (entity.entities?.length &&
                        entity.entities[0]!.valid &&
                        !entity.entities[0]!.valid.valid))
            ) {
                if (invalidRefsCallback && entity.type !== 'bv')
                    invalidRefsCallback(
                        text,
                        text.slice(entity.indices[0], entity.indices[1]),
                        entity
                    );
                continue;
            }
            entities.push(entity);
        }
    }

    return entities.filter((entity) => entity.type !== 'bv');
};
