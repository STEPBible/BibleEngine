import {MigrationInterface, QueryRunner} from "typeorm";

export class VersionType1601037334269 implements MigrationInterface {
    name = 'VersionType1601037334269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE bible_version ADD type text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_9adc280fa0230af76df7a0be0d"`);
        await queryRunner.query(`ALTER TABLE "bible_version" RENAME TO "temporary_bible_version"`);
        await queryRunner.query(`CREATE TABLE "bible_version" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "uid" varchar NOT NULL, "title" varchar NOT NULL, "description" text, "language" varchar(5) NOT NULL, "copyrightShort" varchar, "copyrightLong" text, "chapterVerseSeparator" varchar NOT NULL, "hasStrongs" boolean, "isPlaintext" boolean, "lastUpdate" datetime NOT NULL DEFAULT (datetime('now')), "dataLocation" varchar NOT NULL)`);
        await queryRunner.query(`INSERT INTO "bible_version"("id", "uid", "title", "description", "language", "copyrightShort", "copyrightLong", "chapterVerseSeparator", "hasStrongs", "isPlaintext", "lastUpdate", "dataLocation") SELECT "id", "uid", "title", "description", "language", "copyrightShort", "copyrightLong", "chapterVerseSeparator", "hasStrongs", "isPlaintext", "lastUpdate", "dataLocation" FROM "temporary_bible_version"`);
        await queryRunner.query(`DROP TABLE "temporary_bible_version"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9adc280fa0230af76df7a0be0d" ON "bible_version" ("uid") `);
    }

}
