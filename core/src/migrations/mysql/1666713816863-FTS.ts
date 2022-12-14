import { MigrationInterface, QueryRunner } from 'typeorm';

export class FTS1666713816863 implements MigrationInterface {
    name = 'FTS1666713816863';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `bible_search` (`verse` text NOT NULL, `versionUid` varchar(255) NOT NULL, `versionBook` int NOT NULL, `versionChapter` int NOT NULL, `versionVerse` int NOT NULL, FULLTEXT ftidx (verse)) ENGINE=InnoDB',
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `ftidx` ON `bible_search`', undefined);
        await queryRunner.query('DROP TABLE `bible_search`', undefined);
    }
}
