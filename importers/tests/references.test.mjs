import assert from 'node:assert/strict';
import test from 'node:test';
import { bcv_parser } from 'bible-passage-reference-parser/esm/bcv_parser.js';
import * as de from 'bible-passage-reference-parser/esm/lang/de.js';
import * as en from 'bible-passage-reference-parser/esm/lang/en.js';
import { preferLongerBookAliases } from '../lib/shared/preferLongerBookAliases.js';
import { OsisImporter } from '../lib/bible/osis/index.js';
import {
    getBibleReferenceParserCustomBooks,
    getBibleReferenceFromParsedReference,
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
    preferLongerBookAliases(bcv);
    return bcv;
}

for (const [label, osis] of [
    ['1Joh 1,1', '1John'],
    ['1 Joh 1,1', '1John'],
    ['1. Joh 1,1', '1John'],
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

for (const [text, expected] of [
    ['Joh1,1', 'John.1.1'],
    ['Joh11,2', 'John.11.2'],
    ['Joh. 1,1', 'John.1.1'],
    ['—Joh 1,1', 'John.1.1'],
    ['xJoh 1,1', ''],
    ['éJoh 1,1', ''],
    ['Johxyz 1,1', ''],
    // A single trailing letter remains an explicit compatibility fallback.
    ['Johx 1,1', 'John.1.1'],
    ['joh 1,1', ''],
]) {
    test(`preserves boundaries and chapter digits: ${text}`, () => {
        assert.equal(parser().parse(text).osis(), expected);
    });
}

test('keeps adjacent references and translation labels intact', () => {
    assert.equal(parser().parse('Joh1,1Mark2,2').osis(), 'John.1.1,Mark.2.2');
    assert.deepEqual(parser().parse('1 Joh 1,1 SCH2000').osis_and_translations(), [
        ['1John.1.1', 'SCH2000'],
    ]);
});

test('longest aliases win for prefixes and suffixes, independently at each occurrence', () => {
    const metadata = new Map([
        ['Gen', { abbreviation: 'Alpha', title: 'Alpha Beta', number: 1 }],
        ['Exod', { abbreviation: 'Beta', title: 'Beta Alpha', number: 2 }],
    ]);
    for (const entries of [metadata, new Map([...metadata].reverse())]) {
        const p = parser(entries);
        assert.equal(p.parse('Alpha Beta 1,1; Beta Alpha 2,2').osis(), 'Gen.1.1,Exod.2.2');
    }
});

test('a longer custom name wins over a built-in suffix', () => {
    const p = parser(new Map([
        ['Gen', { abbreviation: 'Alpha Johannes', title: 'Genesis', number: 1 }],
    ]));
    assert.equal(p.parse('Alpha Johannes 1,1').osis(), 'Gen.1.1');
});

test('equal-length custom aliases keep explicit metadata priority', () => {
    const p = parser(new Map([
        ['Gen', { abbreviation: 'Joh', title: 'Genesis', number: 1 }],
    ]));
    assert.equal(p.parse('Joh 1,1').osis(), 'Gen.1.1');
    assert.equal(p.parse('Johannes 1,1').osis(), 'John.1.1');
});

test('compatibility suffixes retain letters and combining marks, but cannot steal exact names', () => {
    // Synthetic metadata, exercising suffix shapes without retaining source prose.
    const p = parser(new Map([
        ['Gen', { abbreviation: 'ಕಲಾ', title: 'Test A', number: 1 }],
        ['Exod', { abbreviation: 'रोम', title: 'Test B', number: 2 }],
        ['Lev', { abbreviation: 'Jo', title: 'Test C', number: 3 }],
    ]));
    assert.equal(p.parse('ಕಲಾನ 1,1').osis(), 'Gen.1.1');
    assert.equal(p.parse('रोमि. 1,1').osis(), 'Exod.1.1');
    assert.equal(p.parse('Job 1,1').osis(), 'Job.1.1');
    assert.equal(p.parse('ಕಲಾ11,2').osis(), 'Gen.11.2');
    assert.equal(p.parse('ಕಲಾನx 1,1').osis(), '');
});

test('alias matching remains stable across repeated parses and context-only references', () => {
    const p = parser();
    for (let i = 0; i < 3; i++) {
        assert.equal(p.parse('1 Joh 1,1; Joh 2,2').osis(), '1John.1.1,John.2.2');
        assert.equal(p.parse_with_context('Vers 3', '1John 1').osis(), '1John.1.3');
    }
});

test('USX notes use the same longest-alias handling', async () => {
    const { UsxImporter } = await import('../lib/bible/usx/index.js');
    const importer = new UsxImporter(undefined, {
        bookMeta,
        versionMeta: { uid: 'TEST', language: 'de', chapterVerseSeparator: ',' },
    });
    const xml = `<usx version="3.0"><book code="JHN" style="id">TEST</book>
        <chapter number="1" style="c" sid="JHN 1"/><para style="p">
        <verse number="1" style="v" sid="JHN 1:1"/>Text
        <note caller="a" style="f"><char style="ft">Ein Hinweis zu 1 Joh 1,1.</char></note>.
        <verse eid="JHN 1:1"/></para><chapter eid="JHN 1"/></usx>`;
    const context = await importer.getContextFromXml(
        { osisId: 'John', abbreviation: 'Joh', title: 'Johannes', number: 43, type: 'nt' },
        xml
    );
    const links = [];
    function visit(value) {
        if (!value || typeof value !== 'object') return;
        if (value.bibleReference) links.push(value);
        for (const child of Object.values(value)) visit(child);
    }
    visit(context.contentContainerStack);
    assert.equal(links.length, 1);
    assert.equal(links[0].content, '1 Joh 1,1');
    assert.equal(links[0].bibleReference.bookOsisId, '1John');
});

function englishReferences(text) {
    const p = new bcv_parser(en);
    p.set_options({
        invalid_passage_strategy: 'include',
        invalid_sequence_strategy: 'include',
        passage_existence_strategy: 'bc',
        consecutive_combination_strategy: 'separate',
    });
    return getReferencesFromText(p, text);
}

for (const [text, expected] of [
    ['Phlm 24', { bookOsisId: 'Phlm', versionChapterNum: 1, versionVerseNum: 24 }],
    ['Jude 5', { bookOsisId: 'Jude', versionChapterNum: 1, versionVerseNum: 5 }],
    ['Obad 2', { bookOsisId: 'Obad', versionChapterNum: 1, versionVerseNum: 2 }],
    ['2John 3', { bookOsisId: '2John', versionChapterNum: 1, versionVerseNum: 3 }],
    ['3John 4', { bookOsisId: '3John', versionChapterNum: 1, versionVerseNum: 4 }],
    ['Phlm 1', { bookOsisId: 'Phlm', versionChapterNum: 1 }],
    ['Phlm 1:1', { bookOsisId: 'Phlm', versionChapterNum: 1, versionVerseNum: 1 }],
    ['Phlm 2-4', {
        bookOsisId: 'Phlm', versionChapterNum: 1, versionVerseNum: 2, versionVerseEndNum: 4,
    }],
    ['Phlm 1-25', {
        bookOsisId: 'Phlm', versionChapterNum: 1, versionVerseNum: 1, versionVerseEndNum: 25,
    }],
    ['John 3', { bookOsisId: 'John', versionChapterNum: 3 }],
    ['John 3ff', { bookOsisId: 'John', versionChapterNum: 3, versionChapterEndNum: 21 }],
    ['John 3:16ff', {
        bookOsisId: 'John', versionChapterNum: 3, versionVerseNum: 16, versionVerseEndNum: 36,
    }],
    ['John 3-5', { bookOsisId: 'John', versionChapterNum: 3, versionChapterEndNum: 5 }],
    ['John 3:1-5', {
        bookOsisId: 'John', versionChapterNum: 3, versionVerseNum: 1, versionVerseEndNum: 5,
    }],
    ['John 3:16-4:2', {
        bookOsisId: 'John', versionChapterNum: 3, versionVerseNum: 16,
        versionChapterEndNum: 4, versionVerseEndNum: 2,
    }],
    ['John 3-4:2', {
        bookOsisId: 'John', versionChapterNum: 3, versionVerseNum: 1,
        versionChapterEndNum: 4, versionVerseEndNum: 2,
    }],
]) {
    test(`link conversion preserves resolved reference: ${text}`, () => {
        const refs = englishReferences(text);
        assert.equal(refs.length, 1);
        const original = structuredClone(refs[0]);
        assert.deepEqual(getBibleReferenceFromParsedReference(refs[0], 'TEST'), {
            versionUid: 'TEST', ...expected,
        });
        assert.deepEqual(refs[0], original);
        const linked = getPhrasesFromParsedReferences(text, refs, 'TEST');
        assert.equal(linked[0].content, text);
        assert.deepEqual(linked[0].bibleReference, { versionUid: 'TEST', ...expected });
    });
}

test('invalid references with empty OSIS retain their previous conversion', () => {
    const [ref] = englishReferences('John 999:2');
    assert.equal(ref.osis, '');
    assert.deepEqual(getBibleReferenceFromParsedReference(ref, 'TEST'), {
        bookOsisId: 'John', versionUid: 'TEST', versionChapterNum: 999, versionVerseNum: 2,
    });
});

test('ambiguous Psalm lists retain the existing parser interpretation', () => {
    const refs = englishReferences('Ps 42:1-11, 44, 45');
    assert.deepEqual(refs.map((ref) => ref.osis), ['Ps.42.1-Ps.42.11', 'Ps.42.44', 'Ps.42.45']);
    assert.deepEqual(refs.map((ref) => getBibleReferenceFromParsedReference(ref, 'TEST')), [
        { bookOsisId: 'Ps', versionUid: 'TEST', versionChapterNum: 42,
            versionVerseNum: 1, versionVerseEndNum: 11 },
        { bookOsisId: 'Ps', versionUid: 'TEST', versionChapterNum: 42, versionVerseNum: 44 },
        { bookOsisId: 'Ps', versionUid: 'TEST', versionChapterNum: 42, versionVerseNum: 45 },
    ]);
});

test('chapter-only sequence items do not acquire verse fields from their integer syntax', () => {
    const refs = englishReferences('John 3, 5');
    assert.deepEqual(refs.map((ref) => getBibleReferenceFromParsedReference(ref, 'TEST')), [
        { bookOsisId: 'John', versionUid: 'TEST', versionChapterNum: 3 },
        { bookOsisId: 'John', versionUid: 'TEST', versionChapterNum: 5 },
    ]);
});
