import { BibleVersion } from './BibleVersion.entity';
import { BibleBook } from './BibleBook.entity';
import { BibleSection } from './BibleSection.entity';
import { BibleParagraph } from './BibleParagraph.entity';
import { BiblePhrase } from './BiblePhrase.entity';
import { BiblePhraseOriginalWord } from './BiblePhraseOriginalWord.entity';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { BibleNote } from './BibleNote.entity';
import { DictionaryEntry } from './DictionaryEntry.entity';

export {
    BibleVersion,
    BibleBook,
    BibleSection,
    BibleParagraph,
    BiblePhrase,
    BiblePhraseOriginalWord,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry
};
export const ENTITIES = [
    BibleVersion,
    BibleBook,
    BibleSection,
    BibleParagraph,
    BiblePhrase,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry
];
