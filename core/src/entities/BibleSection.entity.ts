import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    JoinColumn,
    Index,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { IBibleSection } from '../models/BibleSection';
import { IBibleReferenceRangeNormalized, Document } from '../models';
import { parsePhraseId } from '../utils';

@Entity()
@Index(['versionId', 'phraseStartId', 'phraseEndId'])
// this second index is needed when we also query 'phraseEndId' on its own when selecting
// sections for a range
// @Index(['versionId', 'phraseEndId'])
// if we want to query sections across versions
// @Index(['phraseStartId', 'phraseEndId'])
// @Index(['phraseEndId'])
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

    @Column({ nullable: true })
    subTitle?: string;

    @Column({ nullable: true })
    descriptionJson?: string;

    description: Document;

    @OneToMany(() => BibleCrossReference, crossReference => crossReference.section, {
        cascade: true
    })
    @JoinColumn()
    crossReferences: BibleCrossReference[];

    constructor(section: IBibleSection) {
        // typeorm is seemingly creating objects on startup (without passing parameters), so we
        // need to add a guard here
        if (!section) return;

        Object.assign(this, section);
        if (section.crossReferences)
            this.crossReferences = section.crossReferences.map(
                crossReference => new BibleCrossReference(crossReference, true)
            );
    }

    @AfterLoad()
    parse() {
        if (this.descriptionJson) this.description = JSON.parse(this.descriptionJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        if (this.description) this.descriptionJson = JSON.stringify(this.description);
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
