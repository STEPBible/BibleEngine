import {
    Entity,
    Column,
    JoinColumn,
    OneToMany,
    PrimaryColumn,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import { BibleCrossReference, BibleNote } from '.';
import { generatePhraseId, parsePhraseId } from '../utils';
import { PhraseModifiers, IBiblePhrase, IBiblePhraseRef } from '../models';

@Entity()
export class BiblePhrase implements IBiblePhrase {
    @PrimaryColumn()
    id: number;

    // the id encodes the following attribute:
    reference: Required<IBiblePhraseRef>;

    @Column()
    versionChapterNum: number;
    @Column()
    versionVerseNum: number;

    @Column()
    content: string;

    @Column({ nullable: true })
    modifiersJson: string;
    modifiers: PhraseModifiers;

    @Column({ nullable: true })
    quoteWho?: string;

    @Column({ nullable: true })
    person?: string;

    @Column({ nullable: true })
    strongsJoined?: string;
    strongs?: string[];

    @OneToMany(() => BibleCrossReference, crossReference => crossReference.phrase, {
        cascade: true
    })
    @JoinColumn()
    crossReferences: BibleCrossReference[];

    @OneToMany(() => BibleNote, note => note.phrase, {
        cascade: true
    })
    @JoinColumn()
    notes: BibleNote[];

    constructor(
        phrase: IBiblePhrase,
        reference: Required<IBiblePhraseRef>,
        modifiers?: PhraseModifiers
    ) {
        Object.assign(this, phrase);
        this.reference = reference;
        if (modifiers) this.modifiers = modifiers;
        if (phrase.crossReferences)
            this.crossReferences = phrase.crossReferences.map(
                crossReference => new BibleCrossReference(crossReference, true)
            );
        if (phrase.notes) this.notes = phrase.notes.map(note => new BibleNote(note));
    }

    @AfterLoad()
    parse() {
        // since we got this from the DB we know we have an id and we know it has all the data
        const phraseRef = parsePhraseId(this.id!);
        this.reference = {
            isNormalized: true,
            bookOsisId: phraseRef.bookOsisId,
            normalizedChapterNum: phraseRef.normalizedChapterNum!,
            normalizedVerseNum: phraseRef.normalizedVerseNum!,
            versionId: phraseRef.versionId!,
            phraseNum: phraseRef.phraseNum!
        };

        if (this.strongsJoined) this.strongs = this.strongsJoined.split(',');
        if (this.modifiersJson) this.modifiers = JSON.parse(this.modifiersJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        this.id = generatePhraseId(this.reference);
        if (this.strongs) this.strongsJoined = this.strongs.join(',');
        if (this.modifiers) this.modifiersJson = JSON.stringify(this.modifiers);
    }
}
