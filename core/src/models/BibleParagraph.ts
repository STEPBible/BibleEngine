// import { BibleParagraph } from '@bible-engine/db-schema/generated/db';
// import { Insertable, Selectable, Updateable } from 'kysely';

export interface IBibleParagraph {
    versionId: number;
    phraseStartId: number;
    phraseEndId: number;
}

export interface IBibleParagraphEntity extends IBibleParagraph {
    id: number;
}
