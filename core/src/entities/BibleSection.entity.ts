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
import { BibleCrossReference } from '.';
import { Document, IBibleSectionEntity } from '../models';

@Entity()
@Index(['versionId', 'phraseStartId', 'phraseEndId'])
// this second index is needed when we also query 'phraseEndId' on its own when selecting
// sections for a range
// @Index(['versionId', 'phraseEndId'])
// if we want to query sections across versions
// @Index(['phraseStartId', 'phraseEndId'])
// @Index(['phraseEndId'])
export class BibleSection implements IBibleSectionEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    versionId: number;

    @Column()
    level: number;

    @Column({ type: 'bigint' })
    phraseStartId: number;

    @Column({ type: 'bigint' })
    phraseEndId: number;

    @Column({ nullable: true })
    title?: string;

    @Column({ nullable: true })
    subTitle?: string;

    @Column({ nullable: true })
    descriptionJson?: string;

    description?: Document;

    @OneToMany(() => BibleCrossReference, crossReference => crossReference.section, {
        cascade: true
    })
    @JoinColumn()
    crossReferences?: BibleCrossReference[];

    constructor(section: IBibleSectionEntity) {
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
}
