import { InitialMigration1577688064632 } from './1577688064632-InitialMigration';
import { VersionType1601037334269 } from './1601037334269-VersionType';
import { VersionAbbreviation1602683683972 } from './1602683683972-VersionAbbreviation';
import { PhraseJoinToVersionRefId1603383603377 } from './1603383603377-PhraseJoinToVersionRefId';
import { AddPronunciationField1609105701370 } from './1609105701370-AddPronunciationField';
import { SectionChapterLabel1660299033547 } from './1660299033547-SectionChapterLabel';
import { CrossrefPosition1601037334269 } from './1665491751275-CrossrefPosition';
import { FTS1666713816863 } from './1666713816863-FTS';
export default {
    name: 'sqlite',
    migrations: [
        InitialMigration1577688064632,
        VersionType1601037334269,
        VersionAbbreviation1602683683972,
        PhraseJoinToVersionRefId1603383603377,
        AddPronunciationField1609105701370,
        SectionChapterLabel1660299033547,
        CrossrefPosition1601037334269,
        FTS1666713816863,
    ],
};
