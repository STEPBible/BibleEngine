import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COLUMN_NAME = 'isPlaintext';

export class PlaintextColumnOnVersions1575603883533 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        const column = new TableColumn({ name: COLUMN_NAME, type: 'integer', isNullable: true });
        await queryRunner.addColumn('bible_version', column);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropColumn('bible_version', COLUMN_NAME);
    }
}
