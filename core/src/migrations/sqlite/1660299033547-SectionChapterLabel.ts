import { MigrationInterface, QueryRunner } from 'typeorm';

export class SectionChapterLabel1660299033547 implements MigrationInterface {
    name = 'SectionChapterLabel1660299033547';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE bible_section ADD COLUMN "isChapterLabel" boolean`);
    }

    public async down(): Promise<void> {
        // This migration is not reversible: sqlite does not support DROP COLUMN operation
    }
}
