import { BibleSection } from '@bible-engine/db-schema/generated/db';
import { Insertable, Selectable, Updateable } from 'kysely';
import { IBibleCrossReference } from './BibleCrossReference';
import { IContentSection } from './ContentSection';
import { DocumentRoot } from './Document';

export interface IBibleSectionGeneric {
    phraseStartId: number;
    phraseEndId: number;
}

export interface IBibleSectionBase extends IContentSection {
    description?: DocumentRoot;
    crossReferences?: IBibleCrossReference[];
    isChapterLabel?: boolean;
}

export interface IBibleSectionReduced extends IBibleSectionGeneric, IBibleSectionBase {}

export interface IBibleSection extends IBibleSectionGeneric, IBibleSectionBase {
    versionId: number;
    level: number;
    id?: number;
}

export interface IBibleSectionEntity extends IBibleSection {
    id: number;
}

export interface IBibleSectionHierarchical extends IBibleSectionEntity {
    versionChapterStart: number;
    versionVerseStart: number;
    versionChapterEnd: number;
    versionVerseEnd: number;
    rangeLabel: string;
    subSections: IBibleSectionHierarchical[];
}

export function parseSectionFromDatabase(section: Selectable<BibleSection>): IBibleSectionEntity;
export function parseSectionFromDatabase(
    section: Selectable<BibleSection> | null
): IBibleSectionEntity | null;
export function parseSectionFromDatabase(
    section: Selectable<BibleSection> | null
): IBibleSectionEntity | null {
    if (!section) return null;
    return {
        ...section,
        description:
            typeof section.description === 'string'
                ? JSON.parse(section.description)
                : section.description,
        isChapterLabel: !!section.isChapterLabel || undefined,
        title: section.title || undefined,
        subTitle: section.subTitle || undefined,
    };
}

export function prepareSectionForDatabase(section: IBibleSection): Insertable<BibleSection>;
export function prepareSectionForDatabase(
    section: Partial<IBibleSection>
): Updateable<BibleSection>;
export function prepareSectionForDatabase(
    section: Partial<IBibleSection> | IBibleSection
): Insertable<BibleSection> | Updateable<BibleSection> {
    const result: Updateable<BibleSection> = {};

    // Only include properties if they exist in the input object
    if ('versionId' in section) result.versionId = section.versionId;
    if ('level' in section) result.level = section.level;
    if ('phraseStartId' in section) result.phraseStartId = section.phraseStartId;
    if ('phraseEndId' in section) result.phraseEndId = section.phraseEndId;
    if ('title' in section) result.title = section.title;
    if ('subTitle' in section) result.subTitle = section.subTitle;
    if ('id' in section) result.id = section.id;

    // Transform fields that need special handling, but only if they exist
    if ('description' in section) {
        result.description = section.description ? JSON.stringify(section.description) : null;
    }

    if ('isChapterLabel' in section) {
        result.isChapterLabel = section.isChapterLabel ? 1 : null;
    }

    return result;
}
