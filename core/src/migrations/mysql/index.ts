import { InitialMigration1581194174760 } from './1581194174760-InitialMigration';
import { VersionType1601036751250 } from './1601036751250-VersionType';
import { VersionAbbreviation1602683683972 } from './1602683683972-VersionAbbreviation';
import { PhraseJoinToVersionRefId1603383603377 } from './1603383603377-PhraseJoinToVersionRefId';
import { AddPronunciationField1609105692434 } from './1609105692434-AddPronunciationField';
export default {
    name: 'mysql',
    migrations: [
        InitialMigration1581194174760,
        VersionType1601036751250,
        VersionAbbreviation1602683683972,
        PhraseJoinToVersionRefId1603383603377,
        AddPronunciationField1609105692434
    ]
};
