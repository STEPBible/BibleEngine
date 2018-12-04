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
import { IBibleCrossReference } from '../models/BibleCrossReference';
import { IBibleReferenceRangeNormalized } from '../models';
import { BiblePhrase, BibleSection } from '../entities';

@Entity()
export class BibleCrossReference implements IBibleCrossReference {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    normalizedRefId: number;

    @Column({ nullable: true })
    normalizedRefIdEnd?: number;

    // the normalizedRefIds encode the range attribute:
    range: IBibleReferenceRangeNormalized;

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
    key: string;

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

    constructor(crossRef: IBibleCrossReference, allowCreationWithoutNormalizedReference = false) {
        // typeorm is seemingly creating objects on startup (without passing parameters), so we
        // need to add a guard here
        if (!crossRef) return;

        this.key = crossRef.key;

        if (!crossRef.range.versionId)
            throw new Error(`can't generate cross reference: versionId is missing`);

        this.versionId = crossRef.range.versionId;
        this.versionChapterNum = crossRef.range.versionChapterNum;
        this.versionVerseNum = crossRef.range.versionVerseNum;
        this.versionChapterEndNum = crossRef.range.versionChapterEndNum;
        this.versionVerseEndNum = crossRef.range.versionVerseEndNum;

        if (!crossRef.range.isNormalized) {
            if (allowCreationWithoutNormalizedReference)
                // we need this during the creation of the version, since we can't normalize
                // references there. normalization is done at the end in a seperate step via
                // 'finalizeVersion'
                this.range = {
                    ...crossRef.range,
                    normalizedChapterNum: crossRef.range.versionChapterNum,
                    normalizedVerseNum: crossRef.range.versionVerseNum,
                    normalizedChapterEndNum: crossRef.range.versionChapterEndNum,
                    normalizedVerseEndNum: crossRef.range.normalizedVerseEndNum,
                    isNormalized: true
                };
            else {
                throw new Error(`can't generate cross reference: range is not normalized`);
            }
        } else {
            // in the current setup we won't get here, since during version setup we can only create
            // non-normalized cross-references (they will be generated after the whole version is
            // created). however since we checked for the range being normalized in the if clause,
            // the else clause (and casting to normalized) remains technically correct and is left
            // for reference for now (e.g. for a future use case where we will generate cross-refs,
            // after the version has been created - maybe user generated, etc.)
            this.range = <IBibleReferenceRangeNormalized>crossRef.range;
        }
    }

    @AfterLoad()
    parseId() {
        // since we got this from the DB we know we have an id and we know it has all the data
        const normalizedRef = parseReferenceId(this.normalizedRefId!);
        this.range = {
            isNormalized: true,
            bookOsisId: normalizedRef.bookOsisId,
            normalizedChapterNum: normalizedRef.normalizedChapterNum!,
            normalizedVerseNum: normalizedRef.normalizedVerseNum!
        };

        if (this.normalizedRefIdEnd) {
            const normalizedRefEnd = parseReferenceId(this.normalizedRefIdEnd);
            this.range.normalizedChapterEndNum = normalizedRefEnd.normalizedChapterNum;
            this.range.normalizedVerseEndNum = normalizedRefEnd.normalizedVerseNum;
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        this.normalizedRefId = generateReferenceId(<IBibleReferenceRangeNormalized>this.range);
        if (this.versionChapterEndNum || this.versionVerseEndNum)
            this.normalizedRefIdEnd = generateReferenceId({
                isNormalized: true,
                bookOsisId: this.range.bookOsisId,
                normalizedChapterNum: this.range.normalizedChapterEndNum,
                normalizedVerseNum: this.range.normalizedVerseEndNum
            });
    }
}
