import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1581194174760 implements MigrationInterface {
    name = 'InitialMigration1581194174760';

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            'CREATE TABLE `bible_book` (`versionId` int NOT NULL, `osisId` varchar(100) NOT NULL, `abbreviation` varchar(255) NOT NULL, `number` int NOT NULL, `title` varchar(255) NOT NULL, `longTitle` varchar(255) NULL, `introduction` text NULL, `type` varchar(255) NOT NULL, `chaptersCount` text NOT NULL, `dataLocation` varchar(255) NOT NULL, PRIMARY KEY (`versionId`, `osisId`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_version` (`id` int NOT NULL AUTO_INCREMENT, `uid` varchar(255) NOT NULL, `title` varchar(255) NOT NULL, `description` text NULL, `language` varchar(15) NOT NULL, `copyrightShort` varchar(255) NULL, `copyrightLong` text NULL, `chapterVerseSeparator` varchar(255) NOT NULL, `hasStrongs` tinyint NULL, `isPlaintext` tinyint NULL, `lastUpdate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `dataLocation` varchar(255) NOT NULL, UNIQUE INDEX `IDX_9adc280fa0230af76df7a0be0d` (`uid`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_section` (`id` int NOT NULL AUTO_INCREMENT, `versionId` int NOT NULL, `level` int NOT NULL, `phraseStartId` bigint NOT NULL, `phraseEndId` bigint NOT NULL, `title` varchar(255) NULL, `subTitle` varchar(255) NULL, `description` text NULL, INDEX `IDX_1aa6bd0c6c6460c4cbd355e534` (`versionId`, `phraseStartId`, `phraseEndId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_paragraph` (`id` int NOT NULL AUTO_INCREMENT, `versionId` int NOT NULL, `phraseStartId` bigint NOT NULL, `phraseEndId` bigint NOT NULL, INDEX `IDX_e3050f616f77ea05e0ac554cbc` (`versionId`, `phraseStartId`, `phraseEndId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_note` (`id` int NOT NULL AUTO_INCREMENT, `key` varchar(255) NULL, `type` varchar(255) NULL, `content` text NOT NULL, `phraseId` bigint NULL, INDEX `IDX_66a40d0dd1d4dec456e1241d38` (`phraseId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_phrase` (`id` bigint NOT NULL, `joinToRefId` bigint NULL, `versionId` int NOT NULL, `versionChapterNum` int NOT NULL, `versionVerseNum` int NOT NULL, `versionSubverseNum` int NULL, `sourceTypeId` int NULL, `content` text NOT NULL, `linebreak` tinyint NULL, `skipSpace` varchar(255) NULL, `modifiers` text NULL, `quoteWho` varchar(255) NULL, `person` varchar(255) NULL, `strongs` text NULL, INDEX `IDX_09d57b6b557db9a20107239b77` (`versionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_phrase_original_word` (`id` int NOT NULL AUTO_INCREMENT, `strong` varchar(255) NULL, `type` varchar(255) NULL, `tense` varchar(255) NULL, `voice` varchar(255) NULL, `mood` varchar(255) NULL, `case` varchar(255) NULL, `person` varchar(255) NULL, `number` varchar(255) NULL, `gender` varchar(255) NULL, `extra` varchar(255) NULL, `stem` varchar(255) NULL, `action` varchar(255) NULL, `aspect` varchar(255) NULL, INDEX `IDX_5d94964c03964c3e53facd540b` (`strong`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `dictionary_entry` (`strong` varchar(255) NOT NULL, `dictionary` varchar(255) NOT NULL, `lemma` varchar(255) NULL, `transliteration` varchar(255) NULL, `gloss` varchar(255) NOT NULL, `content` text NULL, PRIMARY KEY (`strong`, `dictionary`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `v11n_rule` (`id` int NOT NULL AUTO_INCREMENT, `sourceRefId` bigint NOT NULL, `standardRefId` bigint NOT NULL, `actionId` int NOT NULL, `sourceTypeId` int NULL, `noteMarker` varchar(255) NOT NULL, `note` varchar(255) NOT NULL, `noteSecondary` varchar(255) NULL, `noteAncientVersions` varchar(255) NULL, `tests` varchar(255) NULL, INDEX `IDX_f797dbd26651ec7266e9db14b1` (`sourceRefId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'CREATE TABLE `bible_cross_reference` (`id` int NOT NULL AUTO_INCREMENT, `normalizedRefId` bigint NOT NULL, `partIndicator` varchar(255) NULL, `normalizedRefIdEnd` bigint NULL, `partIndicatorEnd` varchar(255) NULL, `versionId` int NULL, `versionChapterNum` int NULL, `versionVerseNum` int NULL, `versionChapterEndNum` int NULL, `versionVerseEndNum` int NULL, `key` varchar(255) NULL, `phraseId` bigint NULL, `sectionId` int NULL, INDEX `IDX_7ff9093c7d0193dc69753ff634` (`phraseId`), INDEX `IDX_763d9599de97b88c1adcd12dac` (`sectionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
            undefined
        );
        await queryRunner.query(
            'ALTER TABLE `bible_note` ADD CONSTRAINT `FK_66a40d0dd1d4dec456e1241d382` FOREIGN KEY (`phraseId`) REFERENCES `bible_phrase`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        );
        await queryRunner.query(
            'ALTER TABLE `bible_cross_reference` ADD CONSTRAINT `FK_7ff9093c7d0193dc69753ff6346` FOREIGN KEY (`phraseId`) REFERENCES `bible_phrase`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        );
        await queryRunner.query(
            'ALTER TABLE `bible_cross_reference` ADD CONSTRAINT `FK_763d9599de97b88c1adcd12dacb` FOREIGN KEY (`sectionId`) REFERENCES `bible_section`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
            undefined
        );
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(
            'ALTER TABLE `bible_cross_reference` DROP FOREIGN KEY `FK_763d9599de97b88c1adcd12dacb`',
            undefined
        );
        await queryRunner.query(
            'ALTER TABLE `bible_cross_reference` DROP FOREIGN KEY `FK_7ff9093c7d0193dc69753ff6346`',
            undefined
        );
        await queryRunner.query(
            'ALTER TABLE `bible_note` DROP FOREIGN KEY `FK_66a40d0dd1d4dec456e1241d382`',
            undefined
        );
        await queryRunner.query(
            'DROP INDEX `IDX_763d9599de97b88c1adcd12dac` ON `bible_cross_reference`',
            undefined
        );
        await queryRunner.query(
            'DROP INDEX `IDX_7ff9093c7d0193dc69753ff634` ON `bible_cross_reference`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_cross_reference`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_f797dbd26651ec7266e9db14b1` ON `v11n_rule`',
            undefined
        );
        await queryRunner.query('DROP TABLE `v11n_rule`', undefined);
        await queryRunner.query('DROP TABLE `dictionary_entry`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_5d94964c03964c3e53facd540b` ON `bible_phrase_original_word`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_phrase_original_word`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_09d57b6b557db9a20107239b77` ON `bible_phrase`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_phrase`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_66a40d0dd1d4dec456e1241d38` ON `bible_note`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_note`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_e3050f616f77ea05e0ac554cbc` ON `bible_paragraph`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_paragraph`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_1aa6bd0c6c6460c4cbd355e534` ON `bible_section`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_section`', undefined);
        await queryRunner.query(
            'DROP INDEX `IDX_9adc280fa0230af76df7a0be0d` ON `bible_version`',
            undefined
        );
        await queryRunner.query('DROP TABLE `bible_version`', undefined);
        await queryRunner.query('DROP TABLE `bible_book`', undefined);
    }
}
