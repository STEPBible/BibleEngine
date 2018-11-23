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
import { generateReferenceId, parseReferenceId } from '../utils';
import { BiblePhrase, BibleSection, IBibleReferenceRangeNormalized } from '.';

@Entity()
export class BibleCrossReference implements IBibleReferenceRangeNormalized {
    @PrimaryGeneratedColumn()
    id?: number;
    isNormalized: true;

    @Column()
    normalizedRefId: number;

    @Column({ nullable: true })
    normalizedRefIdEnd?: number;

    // the normalizedRefIds encode the following attributes:
    bookOsisId: string;
    normalizedChapterNum?: number;
    normalizedChapterEndNum?: number;
    normalizedVerseNum?: number;
    normalizedVerseEndNum?: number;

    @Column()
    versionId: number;

    @Column({ nullable: true })
    versionChapterNum?: number;

    @Column({ nullable: true })
    versionVerseNum?: number;

    @Column({ nullable: true })
    versionChapterEndNum?: number;

    @Column({ nullable: true })
    versionVerseEndNum?: number;

    @Column({ nullable: true })
    text?: string;

    @Column({ nullable: true })
    @Index()
    phraseId?: number;
    @ManyToOne(() => BiblePhrase, phrase => phrase.crossReferences)
    phrase?: BiblePhrase;

    @Column({ nullable: true })
    @Index()
    sectionId?: number;

    @ManyToOne(() => BibleSection, section => section.crossReferences)
    section?: BibleSection;

    constructor(initializer: Partial<BibleCrossReference>) {
        if (initializer) Object.assign(this, initializer);
    }

    @AfterLoad()
    parseId() {
        // since we got this from the DB we know we have an id and we know it has all the data
        const normalizedRef = parseReferenceId(this.normalizedRefId!);
        this.bookOsisId = normalizedRef.bookOsisId;
        this.normalizedChapterNum = normalizedRef.normalizedChapterNum!;
        this.normalizedVerseNum = normalizedRef.normalizedVerseNum!;

        if (this.normalizedRefIdEnd) {
            const normalizedRefEnd = parseReferenceId(this.normalizedRefIdEnd);
            this.normalizedChapterEndNum = normalizedRefEnd.normalizedChapterNum;
            this.normalizedVerseEndNum = normalizedRefEnd.normalizedVerseNum;
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        if (
            !this.bookOsisId ||
            (this.versionChapterNum && !this.normalizedChapterNum) ||
            (this.versionVerseNum && !this.normalizedVerseNum) ||
            (this.versionChapterEndNum && !this.normalizedChapterEndNum) ||
            (this.versionVerseEndNum && !this.normalizedVerseEndNum)
        ) {
            // throw new Error(
            //     `can't generate references: missing reference information. please ` +
            //         `use SqlBible::createCrossReference to create the object`
            // );

            // we need to allow saving cross references without normalized references during
            // initial book creation (since at creation time not all information is available
            // to do the normalization)
            this.normalizedRefId = generateReferenceId({
                isNormalized: true,
                bookOsisId: this.bookOsisId
            });
        } else {
            this.normalizedRefId = generateReferenceId(this);
            if (this.versionChapterEndNum || this.versionVerseEndNum)
                this.normalizedRefIdEnd = generateReferenceId({
                    isNormalized: true,
                    bookOsisId: this.bookOsisId,
                    normalizedChapterNum: this.normalizedChapterEndNum,
                    normalizedVerseNum: this.normalizedVerseEndNum
                });
        }
    }
}
