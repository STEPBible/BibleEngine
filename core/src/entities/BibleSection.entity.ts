import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, Index } from 'typeorm';
import { BibleCrossReferenceEntity } from '.';
import { IBibleSectionEntity, DocumentRoot } from '../models';

@Entity('bible_section')
@Index(['versionId', 'phraseStartId', 'phraseEndId'])
// this second index is needed when we also query 'phraseEndId' on its own when selecting
// sections for a range
// @Index(['versionId', 'phraseEndId'])
// if we want to query sections across versions
// @Index(['phraseStartId', 'phraseEndId'])
// @Index(['phraseEndId'])
export class BibleSectionEntity implements IBibleSectionEntity {
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

    @Column({ nullable: true, type: 'simple-json' })
    description?: DocumentRoot;

    @OneToMany(() => BibleCrossReferenceEntity, crossReference => crossReference.section, {
        cascade: true
    })
    @JoinColumn()
    crossReferences?: BibleCrossReferenceEntity[];

    constructor(section: IBibleSectionEntity) {
        // typeorm is seemingly creating objects on startup (without passing parameters), so we
        // need to add a guard here
        // if (!section) return;

        if (section) {
            Object.assign(this, section);
            if (section.crossReferences)
                this.crossReferences = section.crossReferences.map(
                    crossReference => new BibleCrossReferenceEntity(crossReference, true)
                );
        }
    }

    // @AfterLoad()
    // parse() {
    //     if (this.descriptionJson) this.description = JSON.parse(this.descriptionJson);
    // }

    // @BeforeInsert()
    // @BeforeUpdate()
    // async prepare() {
    //     if (this.description) this.descriptionJson = JSON.stringify(this.description);
    // }
}
