import { BibleNote, BibleCrossReference, BibleInput } from '.';

export interface IBibleSection {
    level: number;

    title?: string;

    notes?: BibleNote[];

    crossReferences?: BibleCrossReference[];
}

export interface IBibleSectionWithContent extends IBibleSection {
    content: BibleInput;
}
