import {
    Entity,
    Column,
    JoinColumn,
    OneToMany,
    PrimaryColumn,
    AfterLoad,
    BeforeInsert
} from 'typeorm';
import {
    BiblePhraseOriginalWord,
    BibleCrossReference,
    BibleNote,
    IBiblePhraseRef,
    IBibleReference
} from '.';
import { generatePhraseId, parsePhraseId } from '../utils';

@Entity()
// @Index(['versionId', 'bookOsisId', 'versionChapterNum', 'versionVerseNum'])
export class BiblePhrase implements IBiblePhraseRef, IBibleReference {
    @PrimaryColumn()
    id: number;
    isNormalized: true;

    // the id encodes the following attributes in that order:
    bookOsisId: string;
    normalizedChapterNum: number;
    normalizedVerseNum: number;
    versionId: number;
    phraseNum: number;

    @Column()
    versionChapterNum: number;
    @Column()
    versionVerseNum: number;

    @Column()
    text: string;

    @Column({ nullable: true })
    bold?: boolean;

    @Column({ nullable: true })
    italic?: boolean;

    @Column({ nullable: true })
    divineName?: boolean;

    @Column({ nullable: true })
    jesusWords?: boolean;

    @Column({ nullable: true })
    indentLevel?: number;

    @Column({ nullable: true })
    quoteLevel?: number;

    @Column({ nullable: true })
    strong: string;

    @OneToMany(() => BiblePhraseOriginalWord, originalWord => originalWord.phrase, {
        cascade: true
    })
    @JoinColumn()
    originalWords: BiblePhraseOriginalWord[];

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

    constructor(initializer: Partial<BiblePhrase>) {
        if (initializer) Object.assign(this, initializer);
    }

    @AfterLoad()
    parseId() {
        // since we got this from the DB we know we have an id and we know it has all the data
        const phraseRef = parsePhraseId(this.id!);
        this.versionId = phraseRef.versionId!;
        this.normalizedVerseNum = phraseRef.normalizedVerseNum!;
        this.normalizedChapterNum = phraseRef.normalizedChapterNum!;
        this.bookOsisId = phraseRef.bookOsisId;
    }

    @BeforeInsert()
    async prepare() {
        if (
            !this.bookOsisId ||
            !this.normalizedChapterNum ||
            !this.normalizedVerseNum ||
            !this.versionId ||
            !this.phraseNum
        )
            throw new Error(
                `can't generate phrase ID: missing reference information. please use ` +
                    `SqlBible::preparePhraseForDb on the phrase object before saving`
            );

        this.id = generatePhraseId(this);
    }
}
