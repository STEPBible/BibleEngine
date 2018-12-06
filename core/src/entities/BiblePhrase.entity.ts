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
import { generatePhraseId, parsePhraseId } from '../functions/reference.functions';
import { PhraseModifiers, IBiblePhrase, IBiblePhraseRef } from '../models';

@Entity()
export class BiblePhrase implements IBiblePhrase {
    @PrimaryColumn()
    id: number;

    // the id encodes the following attribute:
    normalizedReference: Required<IBiblePhraseRef>;

    @Column()
    versionChapterNum: number;
    @Column()
    versionVerseNum: number;

    @Column()
    content: string;

    @Column({ nullable: true })
    linebreak: boolean;

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
        // typeorm is seemingly creating objects on startup (without passing parameters), so we
        // need to add a guard here
        if (!phrase) return;

        Object.assign(this, phrase);
        this.normalizedReference = reference;
        if (modifiers) {
            // we don't want to save an modifier object without an active modifier to save space
            let hasActiveModifiers = !!Object.values(modifiers).find(
                modifierValue => modifierValue !== false && modifierValue !== 0
            );

            if (hasActiveModifiers) this.modifiers = modifiers;
        }
        if (phrase.crossReferences) {
            this.crossReferences = phrase.crossReferences.map(
                crossReference => new BibleCrossReference(crossReference, true)
            );
        }
        if (phrase.notes) this.notes = phrase.notes.map(note => new BibleNote(note));
    }

    @AfterLoad()
    parse() {
        // since we got this from the DB we know we have an id and we know it has all the data
        const phraseRef = parsePhraseId(this.id!);
        this.normalizedReference = {
            isNormalized: true,
            bookOsisId: phraseRef.bookOsisId,
            normalizedChapterNum: phraseRef.normalizedChapterNum!,
            normalizedVerseNum: phraseRef.normalizedVerseNum!,
            versionId: phraseRef.versionId!,
            phraseNum: phraseRef.phraseNum!
        };

        if (this.strongsJoined) this.strongs = this.strongsJoined.split(',');
        this.modifiers = this.modifiersJson ? JSON.parse(this.modifiersJson) : {};
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        this.id = generatePhraseId(this.normalizedReference);
        if (this.strongs) this.strongsJoined = this.strongs.join(',');
        if (this.modifiers) this.modifiersJson = JSON.stringify(this.modifiers);
    }
}
