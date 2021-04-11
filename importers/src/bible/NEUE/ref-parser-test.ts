import { BibleReferenceParser, getReferencesFromText } from '@bible-engine/core';

const bcv_parser = require('bible-passage-reference-parser/js/de_bcv_parser').bcv_parser;
const bcv: BibleReferenceParser = new bcv_parser({});
bcv.set_options({
    punctuation_strategy: 'eu',
    invalid_passage_strategy: 'include',
    invalid_sequence_strategy: 'include',
    passage_existence_strategy: 'bc',
});
const localRefRegEx = /(Kapitel|V\.|Vers) ([0-9,.\-–; ]|(und|bis|Kapitel|V\.|Vers))+/g;

// const testString =
//     'Vgl. insbesondere Vers 5 und 11 und Kapitel 2 mit 3 und Joh 3,16 und Kapitel 7,2';

// const testString = 'was auch zu 1. Mose 10,8-12 passen würd';
const testString = 'abc Jesaja 8,23 – 9,1 sdf';

const localOsisId = 'Gen';
const localChapterNum = 3;

const references = getReferencesFromText(bcv, testString, {
    bookOsisId: localOsisId,
    chapterNum: localChapterNum,
    localRefMatcher: localRefRegEx,
});

console.dir(references, { depth: 10 });
