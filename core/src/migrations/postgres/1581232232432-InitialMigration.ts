import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1581232232432 implements MigrationInterface {
    name = 'InitialMigration1581232232432';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `CREATE TABLE "bible_book" ("versionId" integer NOT NULL, "osisId" character varying NOT NULL, "abbreviation" character varying NOT NULL, "number" integer NOT NULL, "title" character varying NOT NULL, "longTitle" character varying, "introduction" text, "type" character varying NOT NULL, "chaptersCount" text NOT NULL, "dataLocation" character varying NOT NULL, CONSTRAINT "PK_866f636c749b0fa411cb70b9456" PRIMARY KEY ("versionId", "osisId"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_version" ("id" SERIAL NOT NULL, "uid" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "language" character varying(5) NOT NULL, "copyrightShort" character varying, "copyrightLong" text, "chapterVerseSeparator" character varying NOT NULL, "hasStrongs" boolean, "isPlaintext" boolean, "lastUpdate" TIMESTAMP NOT NULL DEFAULT now(), "dataLocation" character varying NOT NULL, CONSTRAINT "PK_1e25d91018d5e2ba49fcfed0cc4" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_9adc280fa0230af76df7a0be0d" ON "bible_version" ("uid") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_section" ("id" SERIAL NOT NULL, "versionId" integer NOT NULL, "level" integer NOT NULL, "phraseStartId" bigint NOT NULL, "phraseEndId" bigint NOT NULL, "title" character varying, "subTitle" character varying, "description" text, CONSTRAINT "PK_8943d584bf5b34ee7cba09bf948" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_1aa6bd0c6c6460c4cbd355e534" ON "bible_section" ("versionId", "phraseStartId", "phraseEndId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_paragraph" ("id" SERIAL NOT NULL, "versionId" integer NOT NULL, "phraseStartId" bigint NOT NULL, "phraseEndId" bigint NOT NULL, CONSTRAINT "PK_c59c913431dcd5d2eb9f68615ff" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_e3050f616f77ea05e0ac554cbc" ON "bible_paragraph" ("versionId", "phraseStartId", "phraseEndId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_note" ("id" SERIAL NOT NULL, "key" character varying, "type" character varying, "content" text NOT NULL, "phraseId" integer, CONSTRAINT "PK_39d67ee384222ebb0a222ce3a8b" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_66a40d0dd1d4dec456e1241d38" ON "bible_note" ("phraseId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_phrase" ("id" integer NOT NULL, "joinToRefId" bigint, "versionId" integer NOT NULL, "versionChapterNum" integer NOT NULL, "versionVerseNum" integer NOT NULL, "versionSubverseNum" integer, "sourceTypeId" integer, "content" text NOT NULL, "linebreak" boolean, "skipSpace" character varying, "modifiers" text, "quoteWho" character varying, "person" character varying, "strongs" text, CONSTRAINT "PK_8a809b4bbc283a501f8fd6b44d3" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_09d57b6b557db9a20107239b77" ON "bible_phrase" ("versionId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_phrase_original_word" ("id" SERIAL NOT NULL, "strong" character varying, "type" character varying, "tense" character varying, "voice" character varying, "mood" character varying, "case" character varying, "person" character varying, "number" character varying, "gender" character varying, "extra" character varying, "stem" character varying, "action" character varying, "aspect" character varying, CONSTRAINT "PK_db373c3654835b8a7fa6012d3bb" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_5d94964c03964c3e53facd540b" ON "bible_phrase_original_word" ("strong") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "dictionary_entry" ("strong" character varying NOT NULL, "dictionary" character varying NOT NULL, "lemma" character varying, "transliteration" character varying, "gloss" character varying NOT NULL, "content" text, CONSTRAINT "PK_db31b83817622a9d19f2f7f7da9" PRIMARY KEY ("strong", "dictionary"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "v11n_rule" ("id" SERIAL NOT NULL, "sourceRefId" bigint NOT NULL, "standardRefId" bigint NOT NULL, "actionId" integer NOT NULL, "sourceTypeId" integer, "noteMarker" character varying NOT NULL, "note" character varying NOT NULL, "noteSecondary" character varying, "noteAncientVersions" character varying, "tests" character varying, CONSTRAINT "PK_cf82bbc65e9699ae3c61a89ba04" PRIMARY KEY ("id"))`,
            undefined
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_f797dbd26651ec7266e9db14b1" ON "v11n_rule" ("sourceRefId") `,
            undefined
        );
        await queryRunner.query(
            `CREATE TABLE "bible_cross_reference" ("id" SERIAL NOT NULL, "normalizedRefId" bigint NOT NULL, "partIndicator" character varying, "normalizedRefIdEnd" bigint, "partIndicatorEnd" character varying, "versionId" integer, "versionChapterNum" integer, "versionVerseNum" integer, "versionChapterEndNum" integer, "versionVerseEndNum" integer, "key" character varying, "phraseId" integer, "sectionId" integer, CONSTRAINT "PK_8b717c53ae076d7c159ffa4158d" PRIMARY KEY ("id"))`,
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
        await queryRunner.query(
            `ALTER TABLE "bible_note" ADD CONSTRAINT "FK_66a40d0dd1d4dec456e1241d382" FOREIGN KEY ("phraseId") REFERENCES "bible_phrase"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
            undefined
        );
        await queryRunner.query(
            `ALTER TABLE "bible_cross_reference" ADD CONSTRAINT "FK_7ff9093c7d0193dc69753ff6346" FOREIGN KEY ("phraseId") REFERENCES "bible_phrase"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
            undefined
        );
        await queryRunner.query(
            `ALTER TABLE "bible_cross_reference" ADD CONSTRAINT "FK_763d9599de97b88c1adcd12dacb" FOREIGN KEY ("sectionId") REFERENCES "bible_section"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            `ALTER TABLE "bible_cross_reference" DROP CONSTRAINT "FK_763d9599de97b88c1adcd12dacb"`,
            undefined
        );
        await queryRunner.query(
            `ALTER TABLE "bible_cross_reference" DROP CONSTRAINT "FK_7ff9093c7d0193dc69753ff6346"`,
            undefined
        );
        await queryRunner.query(
            `ALTER TABLE "bible_note" DROP CONSTRAINT "FK_66a40d0dd1d4dec456e1241d382"`,
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
