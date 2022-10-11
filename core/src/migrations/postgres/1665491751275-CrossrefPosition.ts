import { MigrationInterface, QueryRunner } from 'typeorm';

export class CrossrefPosition1665491751275 implements MigrationInterface {
    name = 'CrossrefPosition1665491751275';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bible_version" ADD COLUMN "crossRefBeforePhrase" boolean`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_version" DROP COLUMN "crossRefBeforePhrase"`);
    }
}
