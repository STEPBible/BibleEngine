import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { Kysely, Migrator, ParseJSONResultsPlugin, SqliteDialect } from 'kysely';
import { beMigrationProvider } from '@bible-engine/db-schema';
import {
    BibleEngine,
    parseCrossReferenceFromDatabase,
    prepareCrossReferenceForDatabase,
} from '@bible-engine/core';
import { BeImportFileCreator } from '@bible-engine/importers';

const cases = [
    [
        'same chapter',
        { versionChapterNum: 4, versionVerseNum: 2, versionVerseEndNum: 3 },
        '1Jn 4:2-3',
    ],
    [
        'cross chapter',
        {
            versionChapterNum: 4,
            versionVerseNum: 3,
            versionChapterEndNum: 5,
            versionVerseEndNum: 2,
        },
        '1Jn 4:3-5:2',
    ],
    ['chapters only', { versionChapterNum: 4, versionChapterEndNum: 5 }, '1Jn 4-5'],
    ['single chapter', { versionChapterNum: 4 }, '1Jn 4'],
    ['single verse', { versionChapterNum: 4, versionVerseNum: 2 }, '1Jn 4:2'],
];
const versionFields = [
    'versionChapterNum',
    'versionVerseNum',
    'versionChapterEndNum',
    'versionVerseEndNum',
];
function assertVersionRange(actual, expected) {
    assert.equal(actual.bookOsisId, '1John');
    for (const field of versionFields) assert.equal(actual[field], expected[field], field);
}

for (const [name, numbers] of cases) {
    for (const owner of [{ phraseId: 620010010100101 }, { sectionId: 1 }]) {
        test(`pre-normalization roundtrip: ${name}, ${Object.keys(owner)[0]}`, () => {
            const range = { bookOsisId: '1John', versionId: 1, ...numbers };
            const row = prepareCrossReferenceForDatabase({ range }, owner);
            assert.equal(row.normalizedRefIdEnd, undefined);
            // SQL stores omitted endpoints as NULL.
            const result = parseCrossReferenceFromDatabase({
                ...row,
                id: 1,
                normalizedRefIdEnd: null,
            });
            assertVersionRange(result.range, range);
            assert.equal(result.range.normalizedChapterEndNum, undefined);
            assert.equal(result.range.normalizedVerseEndNum, undefined);
        });
    }
}

test('null and already normalized references retain their existing behavior', () => {
    assert.equal(parseCrossReferenceFromDatabase(null), null);
    const range = {
        bookOsisId: '1John',
        versionId: 1,
        versionChapterNum: 4,
        versionVerseNum: 2,
        versionVerseEndNum: 3,
        normalizedChapterNum: 4,
        normalizedVerseNum: 2,
        normalizedChapterEndNum: 4,
        normalizedVerseEndNum: 3,
    };
    const parsed = parseCrossReferenceFromDatabase({
        ...prepareCrossReferenceForDatabase({ range }, { sectionId: 1 }),
        id: 1,
    });
    assertVersionRange(parsed.range, range);
    assert.equal(parsed.range.normalizedChapterEndNum, 4);
    assert.equal(parsed.range.normalizedVerseEndNum, 3);
});

// Adapt Node's built-in SQLite API to Kysely's synchronous SQLite interface.
// This keeps the regression independent of locally compiled native addon binaries.
function createTestDb() {
    const sqlite = new DatabaseSync(':memory:');
    return new Kysely({
        plugins: [new ParseJSONResultsPlugin()],
        dialect: new SqliteDialect({
            database: {
                close: () => sqlite.close(),
                prepare(sql) {
                    const statement = sqlite.prepare(sql);
                    return {
                        reader: statement.columns().length > 0,
                        all: (parameters) => statement.all(...parameters),
                        run: (parameters) => statement.run(...parameters),
                        iterate: (parameters) => statement.iterate(...parameters),
                    };
                },
            },
        }),
    });
}

function collectReferences(contents) {
    return contents.flatMap((item) => [
        ...(item.crossReferences || []).map((ref) => ({
            ...ref,
            owner: item.type === 'section' ? 'section' : 'phrase',
        })),
        ...collectReferences(item.contents || []),
    ]);
}
function assertReferences(contents) {
    const refs = collectReferences(contents);
    assert.equal(refs.length, cases.length * 2);
    for (const owner of ['phrase', 'section']) {
        for (const [key, numbers, label] of cases) {
            const ref = refs.find((ref) => ref.owner === owner && ref.key === key);
            assert.ok(ref, `${owner}: ${key}`);
            assertVersionRange(ref.range, numbers);
            assert.equal(ref.label, label);
            if (numbers.versionVerseEndNum)
                assert.equal(ref.range.normalizedVerseEndNum, numbers.versionVerseEndNum);
            if (numbers.versionChapterEndNum)
                assert.equal(ref.range.normalizedChapterEndNum, numbers.versionChapterEndNum);
        }
    }
}

test('import, finalize, full output and offline export retain phrase and section ranges', async () => {
    const db = createTestDb();
    const directory = await mkdtemp(join(tmpdir(), 'bibleengine-cross-references-'));
    try {
        const migration = await new Migrator({
            db,
            provider: beMigrationProvider,
        }).migrateToLatest();
        assert.ifError(migration.error);
        const engine = new BibleEngine(db, { dbType: 'sqlite' });
        const version = await engine.addVersion({
            uid: 'range-test',
            title: 'Synthetic range fixture',
            language: 'en',
            chapterVerseSeparator: ':',
            dataLocation: 'db',
        });
        const refs = () =>
            cases.map(([key, numbers]) => ({ key, range: { bookOsisId: '1John', ...numbers } }));
        const phrases = [];
        for (let chapter = 1; chapter <= 5; chapter++) {
            for (let verse = 1; verse <= 4; verse++) {
                phrases.push({
                    type: 'phrase',
                    content: `Synthetic ${chapter}:${verse}`,
                    versionChapterNum: chapter,
                    versionVerseNum: verse,
                    versionSubverseNum: 1,
                    ...(chapter === 1 && verse === 1 ? { crossReferences: refs() } : {}),
                });
            }
        }
        // Bind all import reads and writes to the same SQLite transaction.
        await db.transaction().execute(async (tx) =>
            new BibleEngine(tx, { dbType: 'sqlite' }).addBookWithContent(
                version,
                {
                    book: {
                        osisId: '1John',
                        abbreviation: '1Jn',
                        title: 'First John',
                        number: 62,
                        type: 'nt',
                    },
                    contents: [
                        {
                            type: 'section',
                            title: 'Synthetic section',
                            crossReferences: refs(),
                            contents: [
                                { type: 'group', groupType: 'paragraph', contents: phrases },
                            ],
                        },
                    ],
                },
                { tx }
            )
        );
        const before = await db.selectFrom('bible_cross_reference').selectAll().execute();
        assert.equal(before.length, cases.length * 2);
        for (const row of before) {
            assert.equal(row.normalizedRefIdEnd, null);
            assertVersionRange(
                parseCrossReferenceFromDatabase(row).range,
                cases.find(([key]) => key === row.key)[1]
            );
        }
        await engine.finalizeVersion(version.id);
        const after = await db.selectFrom('bible_cross_reference').selectAll().execute();
        assert.equal(after.length, before.length, 'finalization must not discard references');
        for (const row of after) {
            const numbers = cases.find(([key]) => key === row.key)[1];
            assert.equal(
                Boolean(row.normalizedRefIdEnd),
                Boolean(numbers.versionChapterEndNum || numbers.versionVerseEndNum)
            );
        }
        const output = await engine.getFullDataForReferenceRange({
            versionUid: version.uid,
            bookOsisId: '1John',
        });
        assertReferences(output.content.contents);
        const verseRange = collectReferences(output.content.contents).find(
            (ref) => ref.key === 'same chapter'
        ).range;
        const target = await engine.getFullDataForReferenceRange({
            ...verseRange,
            versionUid: version.uid,
        });
        const targetJson = JSON.stringify(target.content, (key, value) =>
            key === 'parent' ? undefined : value
        );
        assert.match(targetJson, /Synthetic 4:2/);
        assert.match(targetJson, /Synthetic 4:3/);
        assert.doesNotMatch(targetJson, /Synthetic 4:4/);
        const exported = await new BeImportFileCreator(db, directory).createVersionFile(
            version.uid,
            { skipCompression: true }
        );
        const book = JSON.parse(await readFile(join(exported, '1John.json'), 'utf8'));
        assertReferences(book.contents);
    } finally {
        await db.destroy();
        await rm(directory, { recursive: true, force: true });
    }
});
