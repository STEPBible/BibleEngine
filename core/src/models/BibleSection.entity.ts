import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, Index } from 'typeorm';
import { BibleNote } from './BibleNote.entity';
import { BibleCrossReference } from './BibleCrossReference.entity';
import { IBibleSection } from './BibleSection.interface';

@Entity()
@Index(['phraseStartId', 'phraseEndId'])
export class BibleSection implements IBibleSection {
    @PrimaryGeneratedColumn()
    id: number;

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
}
