// This file is just a playground script for testing out the ref-parser

import { BibleReferenceParser } from '@bible-engine/core';
import {
    getPhrasesFromParsedReferences,
    getReferencesFromText,
} from '../../shared/helpers.functions';

const bcv_parser = require('bible-passage-reference-parser/js/en_bcv_parser').bcv_parser;
const bcv: BibleReferenceParser = new bcv_parser({});
bcv.set_options({
    punctuation_strategy: 'us',
    invalid_passage_strategy: 'include',
    invalid_sequence_strategy: 'include',
    passage_existence_strategy: 'bc',
    consecutive_combination_strategy: 'separate',
});
// const localRefRegEx = /(Kapitel|V\.|Vers) ([0-9,.\-–; ]|(und|bis|Kapitel|V\.|Vers))+/g;
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
// const testString =
//     'Hier ist wohl das in 2Pt 2 erwähnte Bedrängervolk aus V. 19 angesprochen (vgl. V. 21).';
// const testString =
//     'L’auteur joue sans doute sur les deux sens. De même à la fin du v. 22 et au v. 20.';
// const testString = '1 Ch 16.34 ; Esd 3.11 ; Ps 100.5 ; 107.1 ; 118.1 ; 136 ; Jr 33.11';
// const testString = 'Pour les v. 12-14, voir le chapitre 35.';
const testString =
    'The books commonly known as 1 &amp; 2 Samuel and 1 &amp; 2 Kings are really one long book.';

const localOsisId = '1Sam';
const localChapterNum = undefined;

const references = getReferencesFromText(
    bcv,
    testString,
    {
        bookOsisId: localOsisId,
        chapterNum: localChapterNum,
        // localRefMatcher: localRefRegEx,
        language: 'en',
    },
    false,
    (...para) => {
        console.log(para);
    }
);

console.dir(references, { depth: 10 });

const phrases = getPhrasesFromParsedReferences(testString, references, 'NIV11');

console.dir(phrases, { depth: 7 });
