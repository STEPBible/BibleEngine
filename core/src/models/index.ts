import { BibleVersion } from './BibleVersion.entity';
import { BibleBook } from './BibleBook.entity';
import { BibleSection } from './BibleSection.entity';
import { BiblePhrase } from './BiblePhrase.entity';
import { BiblePhraseOriginalWord } from './BiblePhraseOriginalWord.entity';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { BibleNote } from './BibleNote.entity';
import { DictionaryEntry } from './DictionaryEntry.entity';

import { IBibleVerse } from './BibleOutput.interface';
import {
    IBibleReference,
    IBibleReferenceRange,
    IBibleReferenceNormalized,
    IBibleReferenceRangeNormalized,
    IBiblePhraseRef
} from './BibleReference.interface';
import { IBibleBook, IBibleBookWithContent } from './BibleBook.interface';
import { IBibleSection, IBibleSectionWithContent } from './BibleSection.interface';
import { IBibleNotePhrase } from './BibleNotePhrase.interface';

import { BibleInput } from './BibleInput.type';
import { BibleBookPlaintext, BibleChapterPlaintext } from './BibleBookPlaintext.type';

export {
    BibleVersion,
    BibleBook,
    BibleSection,
    BiblePhrase,
    BiblePhraseOriginalWord,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry,
    IBibleVerse,
    IBibleNotePhrase,
    IBibleReference,
    IBibleReferenceRange,
    IBibleReferenceNormalized,
    IBibleReferenceRangeNormalized,
    IBiblePhraseRef,
    IBibleBook,
    IBibleBookWithContent,
    IBibleSection,
    IBibleSectionWithContent,
    BibleInput,
    BibleChapterPlaintext,
    BibleBookPlaintext
};
export const ENTITIES = [
    BibleVersion,
    BibleBook,
    BibleSection,
    BiblePhrase,
    BiblePhraseOriginalWord,
    BibleCrossReference,
    BibleNote,
    DictionaryEntry
];
