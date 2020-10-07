import {MigrationInterface, QueryRunner} from "typeorm";

export class VersionType1601036751250 implements MigrationInterface {
    name = 'VersionType1601036751250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `bible_version` ADD `type` varchar(10) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `bible_version` DROP COLUMN `type`");
    }

}
