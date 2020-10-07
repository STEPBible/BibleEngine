import {MigrationInterface, QueryRunner} from "typeorm";

export class VersionType1601036751250 implements MigrationInterface {
    name = 'VersionType1601036751250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_version" ADD COLUMN "type" VARCHAR`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_version" DROP COLUMN "type"`);
    }

}
