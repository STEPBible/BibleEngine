import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    Index,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import { BiblePhrase } from './BiblePhrase.entity';
import { BibleSection } from './BibleSection.entity';
import { IBibleNotePhrase } from './BibleNotePhrase.interface';

@Entity()
export class BibleNote {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ nullable: true })
    key?: string;

    @Column({ nullable: true })
    type?: string;

    @Column()
    noteJson: string;

    @Column({ nullable: true })
    @Index()
    phraseId?: number;

    @ManyToOne(() => BiblePhrase, phrase => phrase.notes)
    phrase?: BiblePhrase;

    @Column({ nullable: true })
    @Index()
    sectionId?: number;
    @ManyToOne(() => BibleSection, section => section.notes)
    section?: BibleSection;

    phrases: IBibleNotePhrase[];

    constructor(initializer: Partial<BibleNote>) {
        if (initializer) Object.assign(this, initializer);
    }

    @AfterLoad()
    parseNoteJson() {
        this.phrases = JSON.parse(this.noteJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async stringifyNoteJson() {
        this.noteJson = JSON.stringify(this.phrases);
    }
}
