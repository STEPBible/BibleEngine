import {MigrationInterface, QueryRunner} from "typeorm";

export class PhraseJoinToVersionRefId1603383603377 implements MigrationInterface {
    name = 'PhraseJoinToVersionRefId1603383603377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE bible_phrase ADD joinToVersionRefId integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_09d57b6b557db9a20107239b77"`);
        await queryRunner.query(`ALTER TABLE "bible_phrase" RENAME TO "temporary_bible_phrase"`);
        await queryRunner.query(`CREATE TABLE "bible_phrase" ("id" integer PRIMARY KEY NOT NULL, "joinToRefId" bigint, "versionId" integer NOT NULL, "versionChapterNum" integer NOT NULL, "versionVerseNum" integer NOT NULL, "versionSubverseNum" integer, "sourceTypeId" integer, "content" text NOT NULL, "linebreak" boolean, "skipSpace" varchar, "modifiers" text, "quoteWho" varchar, "person" varchar, "strongs" text) WITHOUT ROWID`);
        await queryRunner.query(`INSERT INTO "bible_phrase"("id", "joinToRefId", "versionId", "versionChapterNum", "versionVerseNum", "versionSubverseNum", "sourceTypeId", "content", "linebreak", "skipSpace", "modifiers", "quoteWho", "person", "strongs", "joinToVersionRefId") SELECT "id", "joinToRefId", "versionId", "versionChapterNum", "versionVerseNum", "versionSubverseNum", "sourceTypeId", "content", "linebreak", "skipSpace", "modifiers", "quoteWho", "person", "strongs" FROM "temporary_bible_phrase"`);
        await queryRunner.query(`DROP TABLE "temporary_bible_phrase"`);
        await queryRunner.query(`CREATE INDEX "IDX_09d57b6b557db9a20107239b77" ON "bible_phrase" ("versionId") `);
    }

}
