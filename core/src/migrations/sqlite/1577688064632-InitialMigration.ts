import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1577688064632 implements MigrationInterface {
    name = 'InitialMigration1577688064632';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "bible_book" ("versionId" integer NOT NULL, "osisId" varchar NOT NULL, "abbreviation" varchar NOT NULL, "number" integer NOT NULL, "title" varchar NOT NULL, "longTitle" varchar, "introduction" text, "type" varchar NOT NULL, "chaptersCount" text NOT NULL, "dataLocation" varchar NOT NULL, PRIMARY KEY ("versionId", "osisId"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_version" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "uid" varchar NOT NULL, "title" varchar NOT NULL, "description" text, "language" varchar(5) NOT NULL, "copyrightShort" varchar, "copyrightLong" text, "chapterVerseSeparator" varchar NOT NULL, "hasStrongs" boolean, "isPlaintext" boolean, "lastUpdate" datetime NOT NULL DEFAULT (datetime('now')), "dataLocation" varchar NOT NULL)`,
            undefined
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_9adc280fa0230af76df7a0be0d" ON "bible_version" ("uid") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_section" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "versionId" integer NOT NULL, "level" integer NOT NULL, "phraseStartId" bigint NOT NULL, "phraseEndId" bigint NOT NULL, "title" varchar, "subTitle" varchar, "description" text)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_1aa6bd0c6c6460c4cbd355e534" ON "bible_section" ("versionId", "phraseStartId", "phraseEndId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_paragraph" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "versionId" integer NOT NULL, "phraseStartId" bigint NOT NULL, "phraseEndId" bigint NOT NULL)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_e3050f616f77ea05e0ac554cbc" ON "bible_paragraph" ("versionId", "phraseStartId", "phraseEndId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar, "type" varchar, "content" text NOT NULL, "phraseId" integer)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_66a40d0dd1d4dec456e1241d38" ON "bible_note" ("phraseId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_phrase" ("id" integer PRIMARY KEY NOT NULL, "joinToRefId" bigint, "versionId" integer NOT NULL, "versionChapterNum" integer NOT NULL, "versionVerseNum" integer NOT NULL, "versionSubverseNum" integer, "sourceTypeId" integer, "content" text NOT NULL, "linebreak" boolean, "skipSpace" varchar, "modifiers" text, "quoteWho" varchar, "person" varchar, "strongs" text) WITHOUT ROWID`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_09d57b6b557db9a20107239b77" ON "bible_phrase" ("versionId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_phrase_original_word" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "strong" varchar, "type" varchar, "tense" varchar, "voice" varchar, "mood" varchar, "case" varchar, "person" varchar, "number" varchar, "gender" varchar, "extra" varchar, "stem" varchar, "action" varchar, "aspect" varchar)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_5d94964c03964c3e53facd540b" ON "bible_phrase_original_word" ("strong") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "dictionary_entry" ("strong" varchar NOT NULL, "dictionary" varchar NOT NULL, "lemma" varchar, "transliteration" varchar, "gloss" varchar NOT NULL, "content" text, PRIMARY KEY ("strong", "dictionary"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "v11n_rule" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sourceRefId" bigint NOT NULL, "standardRefId" bigint NOT NULL, "actionId" integer NOT NULL, "sourceTypeId" integer, "noteMarker" varchar NOT NULL, "note" varchar NOT NULL, "noteSecondary" varchar, "noteAncientVersions" varchar, "tests" varchar)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_f797dbd26651ec7266e9db14b1" ON "v11n_rule" ("sourceRefId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_cross_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "normalizedRefId" bigint NOT NULL, "partIndicator" varchar, "normalizedRefIdEnd" bigint, "partIndicatorEnd" varchar, "versionId" integer, "versionChapterNum" integer, "versionVerseNum" integer, "versionChapterEndNum" integer, "versionVerseEndNum" integer, "key" varchar, "phraseId" integer, "sectionId" integer)`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_7ff9093c7d0193dc69753ff634" ON "bible_cross_reference" ("phraseId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_763d9599de97b88c1adcd12dac" ON "bible_cross_reference" ("sectionId") `,
            undefined
        );
        await queryRunner.query(`DROP INDEX "IDX_66a40d0dd1d4dec456e1241d38"`, undefined);
        await queryRunner.query(
            `CREATE TABLE "temporary_bible_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar, "type" varchar, "content" text NOT NULL, "phraseId" integer, CONSTRAINT "FK_66a40d0dd1d4dec456e1241d382" FOREIGN KEY ("phraseId") REFERENCES "bible_phrase" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
            undefined
        );
        await queryRunner.query(
            `INSERT INTO "temporary_bible_note"("id", "key", "type", "content", "phraseId") SELECT "id", "key", "type", "content", "phraseId" FROM "bible_note"`,
            undefined
        );
        await queryRunner.query(`DROP TABLE "bible_note"`, undefined);
        await queryRunner.query(
            `ALTER TABLE "temporary_bible_note" RENAME TO "bible_note"`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_66a40d0dd1d4dec456e1241d38" ON "bible_note" ("phraseId") `,
            undefined
        );
        await queryRunner.query(`DROP INDEX "IDX_7ff9093c7d0193dc69753ff634"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_763d9599de97b88c1adcd12dac"`, undefined);
        await queryRunner.query(
            `CREATE TABLE "temporary_bible_cross_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "normalizedRefId" bigint NOT NULL, "partIndicator" varchar, "normalizedRefIdEnd" bigint, "partIndicatorEnd" varchar, "versionId" integer, "versionChapterNum" integer, "versionVerseNum" integer, "versionChapterEndNum" integer, "versionVerseEndNum" integer, "key" varchar, "phraseId" integer, "sectionId" integer, CONSTRAINT "FK_7ff9093c7d0193dc69753ff6346" FOREIGN KEY ("phraseId") REFERENCES "bible_phrase" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_763d9599de97b88c1adcd12dacb" FOREIGN KEY ("sectionId") REFERENCES "bible_section" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
            undefined
        );
        await queryRunner.query(
            `INSERT INTO "temporary_bible_cross_reference"("id", "normalizedRefId", "partIndicator", "normalizedRefIdEnd", "partIndicatorEnd", "versionId", "versionChapterNum", "versionVerseNum", "versionChapterEndNum", "versionVerseEndNum", "key", "phraseId", "sectionId") SELECT "id", "normalizedRefId", "partIndicator", "normalizedRefIdEnd", "partIndicatorEnd", "versionId", "versionChapterNum", "versionVerseNum", "versionChapterEndNum", "versionVerseEndNum", "key", "phraseId", "sectionId" FROM "bible_cross_reference"`,
            undefined
        );
        await queryRunner.query(`DROP TABLE "bible_cross_reference"`, undefined);
        await queryRunner.query(
            `ALTER TABLE "temporary_bible_cross_reference" RENAME TO "bible_cross_reference"`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_7ff9093c7d0193dc69753ff634" ON "bible_cross_reference" ("phraseId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_763d9599de97b88c1adcd12dac" ON "bible_cross_reference" ("sectionId") `,
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_763d9599de97b88c1adcd12dac"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_7ff9093c7d0193dc69753ff634"`, undefined);
        await queryRunner.query(
            `ALTER TABLE "bible_cross_reference" RENAME TO "temporary_bible_cross_reference"`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_cross_reference" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "normalizedRefId" bigint NOT NULL, "partIndicator" varchar, "normalizedRefIdEnd" bigint, "partIndicatorEnd" varchar, "versionId" integer, "versionChapterNum" integer, "versionVerseNum" integer, "versionChapterEndNum" integer, "versionVerseEndNum" integer, "key" varchar, "phraseId" integer, "sectionId" integer)`,
            undefined
        );
        await queryRunner.query(
            `INSERT INTO "bible_cross_reference"("id", "normalizedRefId", "partIndicator", "normalizedRefIdEnd", "partIndicatorEnd", "versionId", "versionChapterNum", "versionVerseNum", "versionChapterEndNum", "versionVerseEndNum", "key", "phraseId", "sectionId") SELECT "id", "normalizedRefId", "partIndicator", "normalizedRefIdEnd", "partIndicatorEnd", "versionId", "versionChapterNum", "versionVerseNum", "versionChapterEndNum", "versionVerseEndNum", "key", "phraseId", "sectionId" FROM "temporary_bible_cross_reference"`,
            undefined
        );
        await queryRunner.query(`DROP TABLE "temporary_bible_cross_reference"`, undefined);
        await queryRunner.query(
            `CREATE INDEX "IDX_763d9599de97b88c1adcd12dac" ON "bible_cross_reference" ("sectionId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_7ff9093c7d0193dc69753ff634" ON "bible_cross_reference" ("phraseId") `,
            undefined
        );
        await queryRunner.query(`DROP INDEX "IDX_66a40d0dd1d4dec456e1241d38"`, undefined);
        await queryRunner.query(
            `ALTER TABLE "bible_note" RENAME TO "temporary_bible_note"`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_note" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "key" varchar, "type" varchar, "content" text NOT NULL, "phraseId" integer)`,
            undefined
        );
        await queryRunner.query(
            `INSERT INTO "bible_note"("id", "key", "type", "content", "phraseId") SELECT "id", "key", "type", "content", "phraseId" FROM "temporary_bible_note"`,
            undefined
        );
        await queryRunner.query(`DROP TABLE "temporary_bible_note"`, undefined);
        await queryRunner.query(
            `CREATE INDEX "IDX_66a40d0dd1d4dec456e1241d38" ON "bible_note" ("phraseId") `,
            undefined
        );
        await queryRunner.query(`DROP INDEX "IDX_763d9599de97b88c1adcd12dac"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_7ff9093c7d0193dc69753ff634"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_cross_reference"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_f797dbd26651ec7266e9db14b1"`, undefined);
        await queryRunner.query(`DROP TABLE "v11n_rule"`, undefined);
        await queryRunner.query(`DROP TABLE "dictionary_entry"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_5d94964c03964c3e53facd540b"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_phrase_original_word"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_09d57b6b557db9a20107239b77"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_phrase"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_66a40d0dd1d4dec456e1241d38"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_note"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e3050f616f77ea05e0ac554cbc"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_paragraph"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_1aa6bd0c6c6460c4cbd355e534"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_section"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9adc280fa0230af76df7a0be0d"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_version"`, undefined);
        await queryRunner.query(`DROP TABLE "bible_book"`, undefined);
    }
}
