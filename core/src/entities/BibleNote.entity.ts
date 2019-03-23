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
import { BiblePhraseEntity } from './BiblePhrase.entity';
import { IBibleNote, DocumentRoot } from '../models';

@Entity('bible_note')
export class BibleNoteEntity implements IBibleNote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    key?: string;

    @Column({ nullable: true })
    type?: string;

    @Column({ type: 'text' })
    contentJson: string;

    content: DocumentRoot;

    @Column({ nullable: true })
    @Index()
    phraseId: number;

    @ManyToOne(() => BiblePhraseEntity, phrase => phrase.notes)
    phrase: BiblePhraseEntity;

    constructor(initializer: IBibleNote, phraseId?: number) {
        Object.assign(this, initializer);
        // if we save this object manually and not as part of a relation, we need to set the
        // phraseId manually
        if (phraseId) this.phraseId = phraseId;
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
