import { Entity, PrimaryGeneratedColumn, Column, Index } from '../../typeorm';
import { IBibleSectionGeneric } from '../models';

@Entity('bible_paragraph')
@Index(['versionId', 'phraseStartId', 'phraseEndId'])
// RADAR: look into comment at sql.functions@getParagraphSql as to why we might enable this again
// @Index(['versionId', 'phraseEndId'])
export class BibleParagraphEntity implements IBibleSectionGeneric {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    versionId: number;

    @Column({ type: 'bigint' })
    phraseStartId: number;

    @Column({ type: 'bigint' })
    phraseEndId: number;

    constructor(versionId: number, phraseStartId: number, phraseEndId: number) {
        this.versionId = versionId;
        this.phraseStartId = phraseStartId;
        this.phraseEndId = phraseEndId;
    }
}
