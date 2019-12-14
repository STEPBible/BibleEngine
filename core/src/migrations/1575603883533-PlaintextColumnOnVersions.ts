import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COLUMN_NAME = 'isPlaintext';

export class PlaintextColumnOnVersions1575603883533 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const column = new TableColumn({ name: COLUMN_NAME, type: 'integer', isNullable: true });
        try {
            await queryRunner.addColumn('bible_version', column);
        } catch (e) {
            console.error(`Cant add column ${COLUMN_NAME}: ${e}`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropColumn('bible_version', COLUMN_NAME);
    }
}
