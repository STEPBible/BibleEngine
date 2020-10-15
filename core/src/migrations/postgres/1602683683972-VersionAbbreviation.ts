import {MigrationInterface, QueryRunner} from "typeorm";

export class VersionAbbreviation1602683683972 implements MigrationInterface {
    name = 'VersionAbbreviation1602683683972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_version" ADD COLUMN "abbreviation" VARCHAR`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_version" DROP COLUMN "abbreviation"`);
    }

}
