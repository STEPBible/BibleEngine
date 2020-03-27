import {
    Entity,
    Column,
    JoinColumn,
    OneToMany,
    PrimaryColumn,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    Index
} from 'typeorm';
import { BibleCrossReferenceEntity } from './BibleCrossReference.entity';
import { BibleNoteEntity } from './BibleNote.entity';
import { generatePhraseId, parsePhraseId } from '../functions/reference.functions';
import { PhraseModifiers, IBiblePhraseRef } from '../models';
import { IBiblePhraseWithNumbers } from '../models/BiblePhrase';
import { IContentPhrase } from '../models/ContentPhrase';

@Entity('bible_phrase', { withoutRowid: true })
export class BiblePhraseEntity implements IBiblePhraseWithNumbers {
    @PrimaryColumn({ type: 'bigint' })
    id: number;

    // the id encodes the following attribute:
    normalizedReference: Required<IBiblePhraseRef>;

    @Column({ type: 'bigint', nullable: true })
    joinToRefId?: number;

    @Column()
    @Index()
    versionId: number;

    @Column()
    versionChapterNum: number;
    @Column()
    versionVerseNum: number;
    @Column({ nullable: true })
    versionSubverseNum?: number;

    @Column({ nullable: true })
    sourceTypeId?: number;

    @Column({ type: 'text' })
    content: string;

    // this column does not need to be indexed, however it is conceptually very different to what we
    // save within 'modifiers' (it's tied to only one phrase), so we keep it on a seperate column.
    @Column({ nullable: true })
    linebreak?: boolean;

    @Column({ nullable: true, type: 'varchar' })
    skipSpace?: IContentPhrase['skipSpace'];

    // everything that is not tied to one single phrase, thus forming groups in the content
    // hierarchy, is saved within 'modifiers'. We don't need to index this, so it's save to group
    // those values together as one serialized JSON in the database. Thus we also keep the schema
    // and types clean and more easy to understand, plus we can easily add new modifiers
    @Column({ nullable: true, type: 'simple-json' })
    modifiers?: PhraseModifiers;

    // this is a seperate column so that we can index it
    @Column({ nullable: true })
    quoteWho?: string;

    // this is a seperate column so that we can index it
    @Column({ nullable: true })
    person?: string;

    @Column({ nullable: true, type: 'simple-array' })
    strongs?: string[];

    @OneToMany(
        () => BibleCrossReferenceEntity,
        crossReference => crossReference.phrase,
        {
            cascade: true
        }
    )
    @JoinColumn()
    crossReferences: BibleCrossReferenceEntity[];

    @OneToMany(
        () => BibleNoteEntity,
        note => note.phrase,
        {
            cascade: true
        }
    )
    @JoinColumn()
    notes: BibleNoteEntity[];

    constructor(
        phrase: IBiblePhraseWithNumbers,
        reference: Required<IBiblePhraseRef>,
        modifiers?: PhraseModifiers
    ) {
        // typeorm is seemingly creating objects on startup (without passing parameters), so we
        // need to add a guard here
        if (!phrase) return;

        Object.assign(this, phrase);
        this.normalizedReference = reference;
        if (modifiers) {
            this.modifiers = modifiers;
        }
        if (phrase.crossReferences) {
            this.crossReferences = phrase.crossReferences.map(crossReference => {
                if (!crossReference.range.versionId)
                    crossReference.range.versionId = reference.versionId;
                return new BibleCrossReferenceEntity(crossReference, true);
            });
        }
        if (phrase.notes) this.notes = phrase.notes.map(note => new BibleNoteEntity(note));
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
            normalizedSubverseNum: phraseRef.normalizedSubverseNum!,
            versionId: phraseRef.versionId!,
            phraseNum: phraseRef.phraseNum!
        };

        // if (this.strongsJoined) this.strongs = this.strongsJoined.split(',');
        // if (this.modifiersJson) this.modifiers = JSON.parse(this.modifiersJson);

        if (!this.versionSubverseNum) delete this.versionSubverseNum;
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        this.id = generatePhraseId(this.normalizedReference);
        this.versionId = this.normalizedReference.versionId;

        // if (this.strongs) this.strongsJoined = this.strongs.join(',');
        if (this.modifiers) {
            // we only save active modifiers to save space
            const modifiers: any = {};
            for (const [key, val] of Object.entries(this.modifiers)) {
                if (val !== false && val !== 0 && val !== null && val !== undefined)
                    modifiers[key] = val;
            }

            this.modifiers = Object.values(modifiers).length === 0 ? undefined : modifiers;
        }
    }

    getModifierValue<T extends keyof PhraseModifiers>(modifier: T): PhraseModifiers[T] {
        if (this.modifiers && this.modifiers[modifier]) return this.modifiers[modifier];
        else {
            // default values
            if (modifier === 'indentLevel' || modifier === 'quoteLevel') {
                return 0 as PhraseModifiers[T];
            } else if (
                modifier === 'translationChange' ||
                modifier === 'orderedListItem' ||
                modifier === 'unorderedListItem' ||
                modifier === 'title' ||
                modifier === 'link' ||
                modifier === 'line'
            ) {
                return undefined;
            } else {
                return false as PhraseModifiers[T];
            }
        }
    }
}
