import { BibleNote } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { DocumentRoot } from './Document.js';

export interface IBibleNote {
    type?: string;
    key?: string;
    content: DocumentRoot;
}

export interface IBibleNoteEntity extends IBibleNote {
    id: number;
}

export function parseNoteFromDatabase(note: Selectable<BibleNote>): IBibleNoteEntity;
export function parseNoteFromDatabase(note: Selectable<BibleNote> | null): IBibleNoteEntity | null;
export function parseNoteFromDatabase(note: Selectable<BibleNote> | null): IBibleNoteEntity | null {
    if (!note) return null;
    return {
        ...note,
        content: typeof note.content === 'string' ? JSON.parse(note.content) : note.content,
        type: note.type || undefined,
        key: note.key || undefined,
    };
}

export function prepareNoteForDatabase(note: IBibleNote, phraseId: number): Insertable<BibleNote>;
export function prepareNoteForDatabase(
    note: Partial<IBibleNote>,
    phraseId: number
): Updateable<BibleNote>;
export function prepareNoteForDatabase(
    note: IBibleNote | Partial<IBibleNote>,
    phraseId: number
): Insertable<BibleNote> | Updateable<BibleNote> {
    const result: Updateable<BibleNote> = {};

    // Always include phraseId as it's required
    result.phraseId = phraseId;

    // Transform content if it exists
    if ('content' in note && note.content) {
        result.content = JSON.stringify(note.content);
    }

    // Only include other properties if they exist in the input object
    if ('type' in note) result.type = note.type;
    if ('key' in note) result.key = note.key;

    return result;
}
