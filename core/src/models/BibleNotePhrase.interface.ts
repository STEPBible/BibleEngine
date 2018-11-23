import { BibleCrossReference } from '.';

export interface IBibleNotePhrase {
    text: string;
    bold?: boolean;

    italic?: boolean;

    indentLevel?: number;

    quoteLevel?: number;

    crossReferences?: BibleCrossReference[];
}
