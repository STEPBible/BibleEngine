import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { parsePhraseId } from '../functions/reference.functions';
import { IBibleReferenceRangeNormalized } from '../models';

@Entity()
@Index(['versionId', 'phraseStartId', 'phraseEndId'])
@Index(['versionId', 'phraseEndId'])
export class BibleParagraph {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    versionId: number;

    @Column({ type: 'bigint' })
    phraseStartId: number;

    @Column({ type: 'bigint' })
    phraseEndId: number;

    constructor(versionId: number, phraseStartId: number, phraseEndId: number) {
        this.versionId = versionId;
        this.phraseStartId = phraseStartId;
        this.phraseEndId = phraseEndId;
    }

    getReferenceRange = (): IBibleReferenceRangeNormalized => {
        const refStart = parsePhraseId(this.phraseStartId);
        const refEnd = parsePhraseId(this.phraseEndId);
        return {
            isNormalized: true,
            versionId: this.versionId,
            bookOsisId: refStart.bookOsisId,
            normalizedChapterNum: refStart.normalizedChapterNum,
            normalizedVerseNum: refStart.normalizedVerseNum,
            normalizedChapterEndNum: refEnd.normalizedChapterNum,
            normalizedVerseEndNum: refEnd.normalizedVerseNum
        };
    };
}
