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
import { Document, IBibleNote } from '../models';

@Entity()
export class BibleNote implements IBibleNote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    key: string;

    @Column({ nullable: true })
    type: string;

    @Column()
    contentJson: string;

    content: Document;

    @Column({ nullable: true })
    @Index()
    phraseId: number;

    @ManyToOne(() => BiblePhrase, phrase => phrase.notes)
    phrase: BiblePhrase;

    constructor(initializer: IBibleNote) {
        Object.assign(this, initializer);
    }

    @AfterLoad()
    parseNoteJson() {
        this.content = JSON.parse(this.contentJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async stringifyNoteJson() {
        this.contentJson = JSON.stringify(this.content);
    }
}
