import { MigrationInterface, QueryRunner } from 'typeorm';

export class FTS1666713816863 implements MigrationInterface {
    name = 'FTS1666713816863';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `bible_search` (`verse` text NOT NULL, `versionUid` varchar(255) NOT NULL, `versionBook` int NOT NULL, `versionChapter` int NOT NULL, `versionVerse` int NOT NULL, PRIMARY KEY (`versionUid`,`versionBook`,`versionChapter`,`versionVerse`), FULLTEXT ftidx (verse)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_search_cjk` (`verse` text NOT NULL, `versionUid` varchar(255) NOT NULL, `versionBook` int NOT NULL, `versionChapter` int NOT NULL, `versionVerse` int NOT NULL, PRIMARY KEY (`versionUid`,`versionBook`,`versionChapter`,`versionVerse`), FULLTEXT ftidx_ngram (verse) WITH PARSER ngram) ENGINE=InnoDB',
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `ftidx` ON `bible_search`', undefined);
        await queryRunner.query('DROP TABLE `bible_search`', undefined);
        await queryRunner.query('DROP INDEX `ftidx_ngram` ON `bible_search_cjk`', undefined);
        await queryRunner.query('DROP TABLE `bible_search_cjk`', undefined);
    }
}
