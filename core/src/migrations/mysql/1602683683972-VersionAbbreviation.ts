import {MigrationInterface, QueryRunner} from "typeorm";

export class VersionAbbreviation1602683683972 implements MigrationInterface {
    name = 'VersionAbbreviation1602683683972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `bible_version` ADD `abbreviation` varchar(10) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `abbreviation`");
    }

}
