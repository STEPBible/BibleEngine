import { MigrationInterface, QueryRunner } from 'typeorm';

export class FTS1666713816863 implements MigrationInterface {
    name = 'FTS1666713816863';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE VIRTUAL TABLE bible_search USING fts5(verse, versionUid UNINDEXED, versionBook UNINDEXED, versionChapter UNINDEXED, versionVerse UNINDEXED);`
        );
    }

    public async down(): Promise<void> {
        // This migration is not reversible: sqlite does not support DROP COLUMN operation
    }
}
