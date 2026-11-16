import assert from 'node:assert/strict';
import test from 'node:test';
import { bcv_parser } from 'bible-passage-reference-parser/esm/bcv_parser.js';
import * as de from 'bible-passage-reference-parser/esm/lang/de.js';
import { OsisImporter } from '../lib/bible/osis/index.js';
import {
    getBibleReferenceParserCustomBooks,
    getPhrasesFromParsedReferences,
    getReferencesFromText,
} from '../lib/shared/helpers.functions.js';

// Canonical order deliberately puts the Gospel before the numbered letters.
const bookMeta = new Map([
    ['John', { abbreviation: 'Joh', title: 'Johannes', number: 43 }],
    ['1John', { abbreviation: '1Joh', title: '1. Johannes', number: 62 }],
    ['2John', { abbreviation: '2Joh', title: '2. Johannes', number: 63 }],
    ['3John', { abbreviation: '3Joh', title: '3. Johannes', number: 64 }],
    ['Rev', { abbreviation: 'Offb', title: 'Offenbarung', number: 66 }],
]);

function parser(metadata = bookMeta) {
    const bcv = new bcv_parser(de);
    bcv.set_options({
        punctuation_strategy: 'eu',
        case_sensitive: 'books',
        invalid_passage_strategy: 'include',
        invalid_sequence_strategy: 'include',
        passage_existence_strategy: 'bc',
        consecutive_combination_strategy: 'separate',
    });
    bcv.add_books({ books: getBibleReferenceParserCustomBooks(metadata) });
    return bcv;
}

for (const [label, osis] of [
    ['1Joh 1,1', '1John'],
    ['2Joh 1,1', '2John'],
    ['3Joh 1,1', '3John'],
    ['1. Johannes 1,1', '1John'],
    ['Joh 1,1', 'John'],
    ['Johannes 1,1', 'John'],
]) {
    test(`custom alias ${label} retains its complete range and correct book`, () => {
        const text = `Siehe (${label}; Offb 19,13).`;
        const refs = getReferencesFromText(parser(), text, { bookOsisId: 'John', chapterNum: 1 });
        assert.deepEqual(refs.map((ref) => ref.osis), [`${osis}.1.1`, 'Rev.19.13']);
        assert.equal(text.slice(...refs[0].indices), label);
        const phrases = getPhrasesFromParsedReferences(text, refs, 'TEST');
        const linked = phrases.filter((phrase) => phrase.bibleReference);
        assert.equal(linked[0].content, label);
        assert.equal(linked[0].bibleReference.bookOsisId, osis);
        assert.equal(linked[0].bibleReference.versionVerseNum, 1);
        assert.equal(phrases[0].content, 'Siehe (');
    });
}

test('metadata insertion order does not change numbered-book detection', () => {
    const text = 'vgl. 1Joh 1,1';
    const reversed = new Map([...bookMeta].reverse());
    for (const metadata of [bookMeta, reversed]) {
        const refs = getReferencesFromText(parser(metadata), text);
        assert.equal(refs[0].osis, '1John.1.1');
        assert.equal(text.slice(...refs[0].indices), '1Joh 1,1');
    }
    assert.equal([...bookMeta.keys()][0], 'John');
});

test('OSIS note links the entire numbered alias after inline formatting', async () => {
    // Synthetic prose preserves the structure of a note split by an italic element.
    const xml = `<osis><osisText osisIDWork="TEST" xml:lang="de">
        <header><work osisWork="TEST"><title>Test</title></work></header>
        <div type="book" osisID="John"><chapter osisID="John.1"><p>
        <verse osisID="John.1.1" sID="John.1.1"/>Text<note n="1"
        osisID="John.1.1!note.1" osisRef="John.1.1">Ein <hi type="italic">Begriff</hi>
        mit Verweisen (vgl. 1Joh 1,1; Offb 19,13).</note>.
        <verse eID="John.1.1"/></p></chapter></div></osisText></osis>`;
    const importer = new OsisImporter(undefined, {
        bookMeta,
        versionMeta: { uid: 'TEST', chapterVerseSeparator: ',' },
    });
    const context = await importer.getContextFromXml(xml);
    const links = [];
    function visit(value) {
        if (!value || typeof value !== 'object') return;
        if (value.bibleReference) links.push(value);
        for (const child of Object.values(value)) visit(child);
    }
    visit(context.books);
    assert.deepEqual(links.map((link) => [link.content, link.bibleReference.bookOsisId]), [
        ['1Joh 1,1', '1John'],
        ['Offb 19,13', 'Rev'],
    ]);
    assert.equal(links[0].bibleReference.versionChapterNum, 1);
    assert.equal(links[0].bibleReference.versionVerseNum, 1);
});
