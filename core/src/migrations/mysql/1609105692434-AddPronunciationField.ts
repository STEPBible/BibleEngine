import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPronunciationField1609105692434 implements MigrationInterface {
    name = 'AddPronunciationField1609105692434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `dictionary_entry` ADD `pronunciation` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `abbreviation`");
        await queryRunner.query("ALTER TABLE `bible_version` ADD `abbreviation` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `type`");
        await queryRunner.query("ALTER TABLE `bible_version` ADD `type` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `type`");
        await queryRunner.query("ALTER TABLE `bible_version` ADD `type` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `abbreviation`");
        await queryRunner.query("ALTER TABLE `bible_version` ADD `abbreviation` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `dictionary_entry` DROP COLUMN `pronunciation`");
    }

}
