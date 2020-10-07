import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { IBibleNote, DocumentRoot, IBiblePhraseWithNumbers } from '../models';

@Entity('bible_note')
export class BibleNoteEntity implements IBibleNote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    key?: string;

    @Column({ nullable: true })
    type?: string;

    @Column({ type: 'simple-json' })
    content: DocumentRoot;

    @Column({ nullable: true })
    @Index()
    phraseId: number;

        // using string notation here to prevent circular reference
    @ManyToOne('BiblePhraseEntity', 'notes')
    phrase: IBiblePhraseWithNumbers;

    constructor(initializer: IBibleNote, phraseId?: number) {
        Object.assign(this, initializer);
        // if we save this object manually and not as part of a relation, we need to set the
        // phraseId manually
        if (phraseId) this.phraseId = phraseId;
    }

    // @AfterLoad()
    // parseNoteJson() {
    //     this.content = JSON.parse(this.contentJson);
    // }

    // @BeforeInsert()
    // @BeforeUpdate()
    // async stringifyNoteJson() {
    //     this.contentJson = JSON.stringify(this.content);
    // }
}
