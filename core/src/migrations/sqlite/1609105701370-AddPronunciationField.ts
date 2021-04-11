import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPronunciationField1609105701370 implements MigrationInterface {
    name = 'AddPronunciationField1609105701370';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE dictionary_entry ADD COLUMN "pronunciation" text`);
    }

    public async down(): Promise<void> {
        // This migration is not reversible: sqlite does not support DROP COLUMN operation
    }
}
