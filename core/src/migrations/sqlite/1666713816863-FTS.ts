import { MigrationInterface, QueryRunner } from 'typeorm';

export class FTS1666713816863 implements MigrationInterface {
    name = 'FTS1666713816863';

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(
                `CREATE VIRTUAL TABLE bible_search USING fts5(verse, versionUid UNINDEXED, versionBook UNINDEXED, versionChapter UNINDEXED, versionVerse UNINDEXED);`
            );
        } catch (error) {
            console.error('failed to create virtual table bible_search', error)
        }
    }

    public async down(): Promise<void> {
        // This migration is not reversible: sqlite does not support DROP COLUMN operation
    }
}
