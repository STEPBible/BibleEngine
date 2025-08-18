import { BibleBook } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { DocumentRoot } from './Document';

export interface IBibleBook {
    type: 'ot' | 'nt' | 'ap';
    osisId: string;
    abbreviation: string;
    number: number;
    title: string;
    longTitle?: string | null;
    chaptersCount?: number[];
    introduction?: DocumentRoot | null;
    dataLocation?: 'db' | 'importing' | 'file' | 'remote';
    versionId?: number;
}

export interface IBibleBookEntity extends IBibleBook {
    versionId: number;
    chaptersCount: number[];
    dataLocation: 'db' | 'importing' | 'file' | 'remote';
}

export function parseBookFromDatabase(book: Selectable<BibleBook>): IBibleBookEntity;
export function parseBookFromDatabase(book?: Selectable<BibleBook> | null): IBibleBookEntity | null;
export function parseBookFromDatabase(
    book?: Selectable<BibleBook> | null
): IBibleBookEntity | null {
    if (!book) return null;
    return {
        ...book,
        chaptersCount: book.chaptersCount
            ? book.chaptersCount.split(',').map((c: string) => +c)
            : [],
        introduction:
            typeof book.introduction === 'string'
                ? JSON.parse(book.introduction)
                : book.introduction,
        type: book.type as 'ot' | 'nt' | 'ap',
        dataLocation: book.dataLocation,
    };
}

/**
 * Converts an application entity to database format
 */
export function prepareBookForDatabase(book: IBibleBook): Insertable<BibleBook>;
export function prepareBookForDatabase(book: Partial<IBibleBook>): Updateable<BibleBook>;
export function prepareBookForDatabase(
    book: IBibleBook | Partial<IBibleBook>
): Insertable<BibleBook> | Updateable<BibleBook> {
    // Only include properties that are valid for the database schema
    // and only if they exist in the input object
    const result: Updateable<BibleBook> = {};

    // Only include properties if they exist in the input object
    if ('osisId' in book) result.osisId = book.osisId;
    if ('abbreviation' in book) result.abbreviation = book.abbreviation;
    if ('number' in book) result.number = book.number;
    if ('title' in book) result.title = book.title;
    if ('longTitle' in book) result.longTitle = book.longTitle;
    if ('versionId' in book) result.versionId = book.versionId;
    if ('type' in book) result.type = book.type;
    if ('dataLocation' in book) result.dataLocation = book.dataLocation;

    // Transform fields that need special handling, but only if they exist
    if ('chaptersCount' in book) {
        result.chaptersCount = Array.isArray(book.chaptersCount)
            ? book.chaptersCount.join(',')
            : '';
    }

    if ('introduction' in book) {
        result.introduction = book.introduction ? JSON.stringify(book.introduction) : null;
    }

    return result;
}

/**
 * Retrieves the verse count for a specific chapter
 * @param book - The Bible book
 * @param chapterNumber - The chapter number
 * @returns The verse count for the given chapter
 */
export function getBookChapterVerseCount(book: IBibleBookEntity, chapterNumber: number) {
    return book.chaptersCount[chapterNumber - 1] || 0;
}
