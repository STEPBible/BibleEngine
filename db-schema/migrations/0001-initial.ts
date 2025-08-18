import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
    let isSqlite = false;
    try {
        // This query will only succeed for SQLite
        await sql`SELECT sqlite_version()`.execute(db);
        isSqlite = true;
    } catch {}

    await db.schema
        .createTable('bible_book')
        .addColumn('versionId', 'integer', (col) => col.notNull())
        .addColumn('osisId', 'varchar(100)', (col) => col.notNull())
        .addColumn('abbreviation', 'varchar(255)', (col) => col.notNull())
        .addColumn('number', 'integer', (col) => col.notNull())
        .addColumn('title', 'varchar(255)', (col) => col.notNull())
        .addColumn('longTitle', 'varchar(255)')
        .addColumn('introduction', 'text')
        .addColumn('type', isSqlite ? 'varchar' : sql`enum('ap','nt','ot')`, (col) =>
            col.defaultTo('nt').notNull()
        )
        .addColumn('chaptersCount', 'text', (col) => col.notNull())
        .addColumn(
            'dataLocation',
            isSqlite ? 'varchar' : sql`enum('db','file','importing','remote')`,
            (col) => col.defaultTo('importing').notNull()
        )
        .addPrimaryKeyConstraint('bible_book_pk', ['versionId', 'osisId'])
        .execute();

    await db.schema
        .createTable('bible_version')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('uid', 'varchar(255)', (col) => col.notNull())
        .addColumn('title', 'varchar(255)', (col) => col.notNull())
        .addColumn('description', 'text')
        .addColumn('language', 'varchar(15)', (col) => col.notNull())
        .addColumn('copyrightShort', 'varchar(255)')
        .addColumn('copyrightLong', 'text')
        .addColumn('chapterVerseSeparator', 'varchar(255)', (col) => col.notNull())
        .addColumn('hasStrongs', 'integer')
        .addColumn('isPlaintext', 'integer')
        // For SQLite use plain "varchar", for MySQL use native enum type with the allowed values.
        .addColumn('type', isSqlite ? 'varchar' : sql`enum('orig','formal','dynamic','free')`)
        .addColumn('abbreviation', 'varchar(10)')
        .addColumn('crossRefBeforePhrase', 'integer')
        .addColumn('lastUpdate', 'datetime(6)', (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP(6)`)
        )
        // For SQLite use plain "varchar", for MySQL use native enum type for dataLocation.
        .addColumn(
            'dataLocation',
            isSqlite ? 'varchar' : sql`enum('db','file','importing','remote')`,
            (col) => col.notNull()
        )
        .addPrimaryKeyConstraint('bible_version_pk', ['id'])
        .execute();

    await db.schema
        .createTable('bible_phrase')
        .addColumn('id', isSqlite ? 'integer' : 'bigint', (col) => col.notNull().primaryKey())
        .addColumn('joinToRefId', 'bigint')
        .addColumn('joinToVersionRefId', 'bigint')
        .addColumn('versionId', 'integer', (col) => col.notNull())
        .addColumn('versionChapterNum', 'integer', (col) => col.notNull())
        .addColumn('versionVerseNum', 'integer', (col) => col.notNull())
        .addColumn('versionSubverseNum', 'integer')
        .addColumn('sourceTypeId', 'integer')
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('linebreak', 'integer')
        .addColumn('skipSpace', isSqlite ? 'varchar' : sql`enum('before','after','both')`)
        .addColumn('modifiers', 'text')
        .addColumn('quoteWho', 'varchar(255)')
        .addColumn('person', 'varchar(255)')
        .addColumn('strongs', 'text')
        .modifyEnd(isSqlite ? sql`WITHOUT ROWID` : sql``)
        .execute();

    await db.schema
        .createTable('bible_section')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('versionId', 'integer', (col) => col.notNull())
        .addColumn('level', 'integer', (col) => col.notNull())
        .addColumn('phraseStartId', 'bigint', (col) => col.notNull())
        .addColumn('phraseEndId', 'bigint', (col) => col.notNull())
        .addColumn('title', 'varchar(255)')
        .addColumn('subTitle', 'varchar(255)')
        .addColumn('description', 'text')
        .addColumn('isChapterLabel', 'integer')
        .addPrimaryKeyConstraint('bible_section_pk', ['id'])
        .execute();

    await db.schema
        .createTable('bible_paragraph')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('versionId', 'integer', (col) => col.notNull())
        .addColumn('phraseStartId', 'bigint', (col) => col.notNull())
        .addColumn('phraseEndId', 'bigint', (col) => col.notNull())
        .addPrimaryKeyConstraint('bible_paragraph_pk', ['id'])
        .execute();

    await db.schema
        .createTable('bible_note')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('key', 'varchar(255)')
        .addColumn('type', 'varchar(255)')
        .addColumn('content', 'text', (col) => col.notNull())
        .addColumn('phraseId', 'bigint')
        .addPrimaryKeyConstraint('bible_note_pk', ['id'])
        .addForeignKeyConstraint('FK_66a40d0dd1d4dec456e1241d382', ['phraseId'], 'bible_phrase', [
            'id',
        ])
        .execute();

    await db.schema
        .createTable('bible_phrase_original_word')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('strong', 'varchar(255)')
        .addColumn('type', 'varchar(255)')
        .addColumn('tense', 'varchar(255)')
        .addColumn('voice', 'varchar(255)')
        .addColumn('mood', 'varchar(255)')
        .addColumn('case', 'varchar(255)')
        .addColumn('person', 'varchar(255)')
        .addColumn('number', 'varchar(255)')
        .addColumn('gender', 'varchar(255)')
        .addColumn('extra', 'varchar(255)')
        .addColumn('stem', 'varchar(255)')
        .addColumn('action', 'varchar(255)')
        .addColumn('aspect', 'varchar(255)')
        .addPrimaryKeyConstraint('bible_phrase_original_word_pk', ['id'])
        .execute();

    await db.schema
        .createTable('dictionary_entry')
        .addColumn('strong', 'varchar(255)', (col) => col.notNull())
        .addColumn('dictionary', 'varchar(255)', (col) => col.notNull())
        .addColumn('lemma', 'varchar(255)')
        .addColumn('transliteration', 'varchar(255)')
        .addColumn('pronunciation', 'varchar(255)')
        .addColumn('gloss', 'varchar(255)', (col) => col.notNull())
        .addColumn('content', 'text')
        .addPrimaryKeyConstraint('dictionary_entry_pk', ['strong', 'dictionary'])
        .execute();

    await db.schema
        .createTable('v11n_rule')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('sourceRefId', 'bigint', (col) => col.notNull())
        .addColumn('standardRefId', 'bigint', (col) => col.notNull())
        .addColumn('actionId', 'integer', (col) => col.notNull())
        .addColumn('sourceTypeId', 'integer')
        .addColumn('noteMarker', 'varchar(255)', (col) => col.notNull())
        .addColumn('note', 'varchar(255)', (col) => col.notNull())
        .addColumn('noteSecondary', 'varchar(255)')
        .addColumn('noteAncientVersions', 'varchar(255)')
        .addColumn('tests', 'varchar(255)')
        .addPrimaryKeyConstraint('v11n_rule_pk', ['id'])
        .execute();

    await db.schema
        .createTable('bible_cross_reference')
        .addColumn('id', 'integer', (col) => col.notNull().autoIncrement())
        .addColumn('normalizedRefId', 'bigint', (col) => col.notNull())
        .addColumn('partIndicator', 'varchar(255)')
        .addColumn('normalizedRefIdEnd', 'bigint')
        .addColumn('partIndicatorEnd', 'varchar(255)')
        .addColumn('versionId', 'integer')
        .addColumn('versionChapterNum', 'integer')
        .addColumn('versionVerseNum', 'integer')
        .addColumn('versionChapterEndNum', 'integer')
        .addColumn('versionVerseEndNum', 'integer')
        .addColumn('key', 'varchar(255)')
        .addColumn('phraseId', 'bigint')
        .addColumn('sectionId', 'integer')
        .addPrimaryKeyConstraint('bible_cross_reference_pk', ['id'])
        .addForeignKeyConstraint('FK_7ff9093c7d0193dc69753ff6346', ['phraseId'], 'bible_phrase', [
            'id',
        ])
        .addForeignKeyConstraint('FK_763d9599de97b88c1adcd12dacb', ['sectionId'], 'bible_section', [
            'id',
        ])
        .execute();

    await db.schema
        .createIndex('IDX_9adc280fa0230af76df7a0be0d')
        .on('bible_version')
        .columns(['uid'])
        .unique()
        .execute();

    await db.schema
        .createIndex('IDX_09d57b6b557db9a20107239b77')
        .on('bible_phrase')
        .columns(['versionId'])
        .execute();

    await db.schema
        .createIndex('IDX_1aa6bd0c6c6460c4cbd355e534')
        .on('bible_section')
        .columns(['versionId', 'phraseStartId', 'phraseEndId'])
        .execute();

    await db.schema
        .createIndex('IDX_e3050f616f77ea05e0ac554cbc')
        .on('bible_paragraph')
        .columns(['versionId', 'phraseStartId', 'phraseEndId'])
        .execute();

    await db.schema
        .createIndex('IDX_66a40d0dd1d4dec456e1241d38')
        .on('bible_note')
        .columns(['phraseId'])
        .execute();

    await db.schema
        .createIndex('IDX_5d94964c03964c3e53facd540b')
        .on('bible_phrase_original_word')
        .columns(['strong'])
        .execute();

    await db.schema
        .createIndex('IDX_f797dbd26651ec7266e9db14b1')
        .on('v11n_rule')
        .columns(['sourceRefId'])
        .execute();

    await db.schema
        .createIndex('IDX_7ff9093c7d0193dc69753ff634')
        .on('bible_cross_reference')
        .columns(['phraseId'])
        .execute();

    await db.schema
        .createIndex('IDX_763d9599de97b88c1adcd12dac')
        .on('bible_cross_reference')
        .columns(['sectionId'])
        .execute();

    if (isSqlite) {
        try {
            await sql`CREATE VIRTUAL TABLE bible_search USING fts5(
                verse, 
                versionUid UNINDEXED, 
                versionBook UNINDEXED, 
                versionChapter UNINDEXED, 
                versionVerse UNINDEXED
            )`.execute(db);
        } catch (error) {
            console.error(
                'Failed to create virtual table bible_search. This is an expected error if you use SQLite versions without fts support. ' +
                    "It can be safely ignored as long as you don't enable/use full text search features in BibleEngine",
                error
            );
        }
    } else {
        await db.schema
            .createTable('bible_search')
            .addColumn('verse', 'text', (col) => col.notNull())
            .addColumn('versionUid', 'varchar(255)', (col) => col.notNull())
            .addColumn('versionBook', 'integer', (col) => col.notNull())
            .addColumn('versionChapter', 'integer', (col) => col.notNull())
            .addColumn('versionVerse', 'integer', (col) => col.notNull())
            .addPrimaryKeyConstraint('bible_search_pk', [
                'versionUid',
                'versionBook',
                'versionChapter',
                'versionVerse',
            ])
            .execute();

        await sql`ALTER TABLE bible_search ADD FULLTEXT INDEX ftidx (verse)`.execute(db);

        await db.schema
            .createTable('bible_search_cjk')
            .addColumn('verse', 'text', (col) => col.notNull())
            .addColumn('versionUid', 'varchar(255)', (col) => col.notNull())
            .addColumn('versionBook', 'integer', (col) => col.notNull())
            .addColumn('versionChapter', 'integer', (col) => col.notNull())
            .addColumn('versionVerse', 'integer', (col) => col.notNull())
            .addPrimaryKeyConstraint('bible_search_cjk_pk', [
                'versionUid',
                'versionBook',
                'versionChapter',
                'versionVerse',
            ])
            .execute();

        await sql`ALTER TABLE bible_search_cjk ADD FULLTEXT INDEX ftidx_cjk (verse) WITH PARSER ngram`.execute(
            db
        );
    }
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`DROP TABLE IF EXISTS bible_search_cjk`.execute(db);
    await sql`DROP TABLE IF EXISTS bible_search`.execute(db);
    await db.schema.dropTable('bible_cross_reference').execute();
    await db.schema.dropTable('v11n_rule').execute();
    await db.schema.dropTable('dictionary_entry').execute();
    await db.schema.dropTable('bible_phrase_original_word').execute();
    await db.schema.dropTable('bible_note').execute();
    await db.schema.dropTable('bible_paragraph').execute();
    await db.schema.dropTable('bible_section').execute();
    await db.schema.dropTable('bible_phrase').execute();
    await db.schema.dropTable('bible_version').execute();
    await db.schema.dropTable('bible_book').execute();
}

export default { up, down };
