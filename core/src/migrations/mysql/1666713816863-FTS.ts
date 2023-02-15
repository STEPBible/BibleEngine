import { MigrationInterface, QueryRunner } from 'typeorm';

export class FTS1666713816863 implements MigrationInterface {
    name = 'FTS1666713816863';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE `bible_search` (`verse` text NOT NULL, `versionUid` varchar(255) NOT NULL, `versionBook` int NOT NULL, `versionChapter` int NOT NULL, `versionVerse` int NOT NULL, PRIMARY KEY (`versionUid`,`versionBook`,`versionChapter`,`versionVerse`), FULLTEXT ftidx (verse)) ENGINE=InnoDB',
            undefined
        );

        let sqlIndexOptions: string;
        // mariadb has no ngram parser, so we use mroonga instead if it's available
        const mroonga = await queryRunner.query(
            'SELECT * FROM INFORMATION_SCHEMA.ENGINES WHERE ENGINE = "Mroonga"',
            undefined
        );
        if (mroonga.length > 0) sqlIndexOptions = 'FULLTEXT ftidx_cjk (verse)) ENGINE=Mroonga';
        else {
            const ngram = await queryRunner.query(
                'SELECT * FROM INFORMATION_SCHEMA.PLUGINS WHERE PLUGIN_NAME = "ngram"',
                undefined
            );
            if (ngram.length > 0)
                sqlIndexOptions = 'FULLTEXT ftidx_cjk (verse) WITH PARSER ngram) ENGINE=InnoDB';
            // if there is now cjk-compatible fulltext parser, we keep it at the default one, which is not ideal but better than nothing
            else sqlIndexOptions = 'FULLTEXT ftidx_cjk (verse)) ENGINE=InnoDB';
        }

        await queryRunner.query(
            'CREATE TABLE `bible_search_cjk` (`verse` text NOT NULL, `versionUid` varchar(255) NOT NULL, `versionBook` int NOT NULL, `versionChapter` int NOT NULL, `versionVerse` int NOT NULL, PRIMARY KEY (`versionUid`,`versionBook`,`versionChapter`,`versionVerse`), ' +
                sqlIndexOptions,
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `ftidx` ON `bible_search`', undefined);
        await queryRunner.query('DROP TABLE `bible_search`', undefined);
        await queryRunner.query('DROP INDEX `ftidx_cjk` ON `bible_search_cjk`', undefined);
        await queryRunner.query('DROP TABLE `bible_search_cjk`', undefined);
    }
}
