import {
    BibleReferenceParser,
    DocumentPhrase,
    IBibleReferenceRangeQuery,
} from '@bible-engine/core';
import {
    endsWithNoSpaceAfterChar,
    getReferencesFromText,
    startsWithNoSpaceBeforeChar,
} from '../../shared/helpers.functions';

const bcv_parser = require('bible-passage-reference-parser/js/de_bcv_parser').bcv_parser;
const bcv: BibleReferenceParser = new bcv_parser({});
bcv.set_options({
    punctuation_strategy: 'eu',
    invalid_passage_strategy: 'include',
    invalid_sequence_strategy: 'include',
    passage_existence_strategy: 'bc',
    consecutive_combination_strategy: 'separate',
});
const localRefRegEx = /(Kapitel|V\.|Vers) ([0-9,.\-–; ]|(und|bis|Kapitel|V\.|Vers))+/g;
// const localRefRegEx = /(^| )(chapter|ch\.|v\.|verse|verses) ([0-9:\-–; ,]|(and|to|chapter|ch\.|v\.|verse|verses))+/gi;

// const testString =
//     'Vgl. insbesondere Vers 5 und 11 und Kapitel 2 mit 3 und Joh 3,16 und Kapitel 7,2';

// const testString = 'was auch zu 1. Mose 10,8-12 passen würd';
// const testString = 'abc Jesaja 8,23 – 9,1 sdf';
// const testString = 'Vergleiche die Anmerkungen zu Kapitel 14,7 und 16,7.';
// const testString = 'canopy; also verses 7, 8, 14, 15, 17, 20';
// const testString = 'Hebrew verse 5';
// const testString =
// 'v. 13 ir neglect of his temple (see Lev. 26:2-20). He called them in v. 1 to repent and renew their covenant with the God of th';
// const testString =
// 'bezeichnet sowohl den Lufthimmel über der Erde (z.B. 5Mo 4,17) als auch den Sternenhimmel (z.B. 5Mo 4,19) und den Himmel als Thronsitz Gottes (z.B. Ps 2,4).';
// const testString =
//     ' das, was Gott heilig ist, vor Mißbrauch und Entweihung zu schützen (vgl. u.a. 2Mo 25,18; 26,1; 1Kön 8,6).';
const testString =
    'Hier ist wohl das in 2Pt 2 erwähnte Bedrängervolk aus V. 19 angesprochen (vgl. V. 21).';

const localOsisId = 'Isa';
// const localChapterNum = 20;
const localChapterNum = 33;

// console.log(testString.match(localRefRegEx));

// exit();

const references = getReferencesFromText(bcv, testString, {
    bookOsisId: localOsisId,
    chapterNum: localChapterNum,
    localRefMatcher: localRefRegEx,
});

console.dir(references, { depth: 10 });

const phrases = [];

const newPhrase: DocumentPhrase = {
    type: 'phrase',
    content: testString,
};

// sort reference by starting indices
references.sort((a, b) => a.indices[0] - b.indices[0]);

let currentIndex = 0;
for (const ref of references) {
    const refText = newPhrase.content.slice(ref.indices[0], ref.indices[1]).trim();

    if (currentIndex < ref.indices[0]) {
        // create phrase from text at range currentIndex to start of reference
        const fillText = newPhrase.content.slice(currentIndex, ref.indices[0]).trim();
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
    const bibleReference: IBibleReferenceRangeQuery = {
        bookOsisId: ref.start.b,
        versionUid: 'NEUE',
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
        if (ref.start.v !== ref.end.v || ref.start.c !== ref.end.c)
            bibleReference.versionVerseEndNum = ref.end.v;
    }
    if (ref.start.c !== ref.end.c) {
        bibleReference.versionChapterEndNum = ref.end.c;
    }
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

if (currentIndex <= newPhrase.content.length - 1) {
    // create phrase from text after last reference
    const endText = newPhrase.content.slice(currentIndex).trim();
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

console.dir(phrases, { depth: 7 });
