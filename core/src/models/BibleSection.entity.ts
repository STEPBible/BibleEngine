import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, Index } from 'typeorm';
import { BibleNote } from './BibleNote.entity';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { IBibleSection } from './BibleSection.interface';
import { IBibleReferenceRangeNormalized } from '../models';
import { parsePhraseId } from '../utils';

@Entity()
@Index(['versionId', 'level', 'phraseStartId', 'phraseEndId'])
// this second index is needed since we also query 'phraseEndId' on its own when selecting
// sections for a range
@Index(['versionId', 'level', 'phraseEndId'])
// if we want to query section cross versions
@Index(['level', 'phraseStartId', 'phraseEndId'])
export class BibleSection implements IBibleSection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    versionId: number;

    @Column()
    level: number;

    @Column({})
    phraseStartId: number;

    @Column({})
    phraseEndId: number;

    @Column({ nullable: true })
    title?: string;

    @OneToMany(() => BibleNote, note => note.section, {
        cascade: true
    })
    @JoinColumn()
    notes?: BibleNote[];

    @OneToMany(() => BibleCrossReference, crossReference => crossReference.section, {
        cascade: true
    })
    @JoinColumn()
    crossReferences?: BibleCrossReference[];

    constructor(initializer: Partial<BibleSection>) {
        if (initializer) Object.assign(this, initializer);
    }

    getReferenceRange = (): IBibleReferenceRangeNormalized => {
        const refStart = parsePhraseId(this.phraseStartId);
        const refEnd = parsePhraseId(this.phraseEndId);
        return {
            isNormalized: true,
            versionId: this.versionId,
            bookOsisId: refStart.bookOsisId,
            normalizedChapterNum: refStart.normalizedChapterNum,
            normalizedVerseNum: refStart.normalizedVerseNum,
            normalizedChapterEndNum: refEnd.normalizedChapterNum,
            normalizedVerseEndNum: refEnd.normalizedVerseNum
        };
    };
}
