import { BibleVersion } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { DocumentRoot } from './Document.js';

export interface IBibleVersion {
    id?: number;
    uid: string;
    abbreviation?: string | null;
    title: string;
    description?: DocumentRoot;
    language: string;
    copyrightShort?: string | null;
    copyrightLong?: DocumentRoot;
    chapterVerseSeparator: string;
    hasStrongs?: boolean;
    isPlaintext?: boolean;
    lastUpdate?: Date;
    dataLocation?: 'db' | 'importing' | 'file' | 'remote';
    type?: 'orig' | 'formal' | 'dynamic' | 'free';
    crossRefBeforePhrase?: boolean;
}

export interface IBibleVersionEntity extends IBibleVersion {
    id: number;
    lastUpdate: Date;
}

/**
 * Converts a database row to an application entity
 */
export function parseVersionFromDatabase(version: Selectable<BibleVersion>): IBibleVersionEntity;
export function parseVersionFromDatabase(
    version?: Selectable<BibleVersion> | null
): IBibleVersionEntity | null;
export function parseVersionFromDatabase(
    version?: Selectable<BibleVersion> | null
): IBibleVersionEntity | null {
    if (!version) return null;
    return {
        ...version,
        description:
            typeof version.description === 'string'
                ? JSON.parse(version.description)
                : version.description,
        copyrightLong:
            typeof version.copyrightLong === 'string'
                ? JSON.parse(version.copyrightLong)
                : version.copyrightLong,
        crossRefBeforePhrase: !!version.crossRefBeforePhrase,
        hasStrongs: !!version.hasStrongs,
        isPlaintext: !!version.isPlaintext,
        id: version.id,
        lastUpdate: version.lastUpdate,
        type: version.type || undefined,
        dataLocation: version.dataLocation,
    };
}

export function prepareVersionForDatabase(version: IBibleVersion): Insertable<BibleVersion>;
export function prepareVersionForDatabase(
    version: Partial<IBibleVersion>
): Updateable<BibleVersion>;
export function prepareVersionForDatabase(
    version: Partial<IBibleVersion> | IBibleVersion
): Insertable<BibleVersion> | Updateable<BibleVersion> {
    const result: Updateable<BibleVersion> = {};

    // Only include properties if they exist in the input object
    if ('uid' in version) result.uid = version.uid;
    if ('abbreviation' in version) result.abbreviation = version.abbreviation;
    if ('title' in version) result.title = version.title;
    if ('language' in version) result.language = version.language;
    if ('copyrightShort' in version) result.copyrightShort = version.copyrightShort;
    if ('chapterVerseSeparator' in version)
        result.chapterVerseSeparator = version.chapterVerseSeparator;
    if ('lastUpdate' in version) result.lastUpdate = version.lastUpdate;
    if ('id' in version) result.id = version.id;

    // Transform fields that need special handling, but only if they exist
    if ('description' in version)
        result.description = version.description ? JSON.stringify(version.description) : null;
    if ('copyrightLong' in version)
        result.copyrightLong = version.copyrightLong ? JSON.stringify(version.copyrightLong) : null;
    if ('crossRefBeforePhrase' in version)
        result.crossRefBeforePhrase = version.crossRefBeforePhrase ? 1 : null;
    if ('hasStrongs' in version) result.hasStrongs = version.hasStrongs ? 1 : null;
    if ('isPlaintext' in version) result.isPlaintext = version.isPlaintext ? 1 : null;
    if ('type' in version) result.type = version.type || null;
    if ('dataLocation' in version) result.dataLocation = version.dataLocation || 'db';

    return result;
}
