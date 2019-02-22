import { BibleVersionEntity } from './BibleVersion.entity';
import { BibleBookEntity } from './BibleBook.entity';
import { BibleSectionEntity } from './BibleSection.entity';
import { BibleParagraphEntity } from './BibleParagraph.entity';
import { BiblePhraseEntity } from './BiblePhrase.entity';
import { BiblePhraseOriginalWordEntity } from './BiblePhraseOriginalWord.entity';
import { BibleCrossReferenceEntity } from './BibleCrossReference.entity';
import { BibleNoteEntity } from './BibleNote.entity';
import { DictionaryEntryEntity } from './DictionaryEntry.entity';
import { V11nRuleEntity } from './V11nRule.entity';

export {
    BibleVersionEntity,
    BibleBookEntity,
    BibleSectionEntity,
    BibleParagraphEntity,
    BiblePhraseEntity,
    BiblePhraseOriginalWordEntity,
    BibleCrossReferenceEntity,
    BibleNoteEntity,
    DictionaryEntryEntity,
    V11nRuleEntity
};
export const ENTITIES = [
    BibleVersionEntity,
    BibleBookEntity,
    BibleSectionEntity,
    BibleParagraphEntity,
    BiblePhraseEntity,
    BibleCrossReferenceEntity,
    BibleNoteEntity,
    DictionaryEntryEntity,
    V11nRuleEntity
];
