import { BibleVersion } from './BibleVersion.entity';
import { BibleBook } from './BibleBook.entity';
import { BibleSection } from './BibleSection.entity';
import { BibleParagraph } from './BibleParagraph.entity';
import { BiblePhrase } from './BiblePhrase.entity';
import { BiblePhraseOriginalWord } from './BiblePhraseOriginalWord.entity';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { BibleNote } from './BibleNote.entity';
import { DictionaryEntry } from './DictionaryEntry.entity';
import { V11nRule } from './V11nRule.entity';

export {
    BibleVersion,
    BibleBook,
    BibleSection,
    BibleParagraph,
    BiblePhrase,
    BiblePhraseOriginalWord,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry,
    V11nRule
};
export const ENTITIES = [
    BibleVersion,
    BibleBook,
    BibleSection,
    BibleParagraph,
    BiblePhrase,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry,
    V11nRule
];
