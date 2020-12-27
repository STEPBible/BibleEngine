import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPronunciationField1609105697104 implements MigrationInterface {
    name = 'AddPronunciationField1609105697104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dictionary_entry" ADD "pronunciation" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dictionary_entry" DROP COLUMN "pronunciation"`);
    }

}
