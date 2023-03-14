import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhraseJoinToVersionRefId1603383603377 implements MigrationInterface {
    name = 'PhraseJoinToVersionRefId1603383603377';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "bible_phrase" ADD COLUMN "joinToVersionRefId" bigint`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bible_phrase" DROP COLUMN "joinToVersionRefId"`);
    }
}
