import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrossrefPosition1601037334269 implements MigrationInterface {
    name = 'CrossrefPosition1601037334269';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE bible_version ADD "crossRefBeforePhrase" boolean`);
    }

    public async down(): Promise<void> {
        // This migration is not reversible: sqlite does not support DROP COLUMN operation
    }
}
