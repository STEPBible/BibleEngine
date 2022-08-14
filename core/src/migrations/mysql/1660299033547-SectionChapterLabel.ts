import { MigrationInterface, QueryRunner } from 'typeorm';

export class SectionChapterLabel1660299033547 implements MigrationInterface {
    name = 'SectionChapterLabel1660299033547';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `bible_section` ADD `isChapterLabel` tinyint NULL');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `bible_section` DROP COLUMN `isChapterLabel`');
    }
}
