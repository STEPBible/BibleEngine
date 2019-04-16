import {
    Entity,
    Column,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    PrimaryGeneratedColumn,
    Index
} from 'typeorm';
import { IV11nRule, IBibleReference, IBibleReferenceNormalized } from '../models';
import {
    generateReferenceId,
    generateNormalizedRangeFromVersionRange,
    parseReferenceId
} from '../functions/reference.functions';

@Entity('v11n_rule')
export class V11nRuleEntity implements IV11nRule {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column({ type: 'bigint' })
    sourceRefId: number;
    sourceRef: IBibleReference;

    @Column({ type: 'bigint' })
    standardRefId: number;
    standardRef: IBibleReferenceNormalized;

    @Column()
    actionId: number;
    action: IV11nRule['action'];

    @Column({ nullable: true })
    sourceTypeId: number;

    @Column()
    noteMarker: string;

    @Column()
    note: string;

    @Column({ nullable: true })
    noteSecondary: string;

    @Column({ nullable: true })
    noteAncientVersions: string;

    @Column({ nullable: true })
    tests: string;

    static actionTypes = new Map<number, IV11nRule['action']>([
        [1, 'Keep verse'],
        [2, 'Renumber verse'],
        [3, 'Merged with'],
        [4, 'Empty verse']
    ]);

    static notePhrases = new Map<string, string>([
        ['other', 'In some Bibles the verse numbering here is REF'],
        ['otherDan', 'In some Bibles the verse numbering here is Daniel REF'],
        ['version', 'Normally in this Bible the verse numbering here is REF'],
        ['versionDan', 'Normally in this Bible the verse numbering here is Daniel REF'],
        [
            'versionMerge',
            'Normally in this Bible, this verse and the next are merged into one verse that is numbered REF'
        ],
        [
            'versionMissing',
            'Normally in this Bible, text may be missing here because this verse is merged with REF'
        ],
        ['wordsFrom', 'This verse includes words that are at REF'],
        ['wordsAlsoAt', 'This verse includes words that are also at REF'],
        ['wordsAltAt', 'This verse includes words that are alternatively at REF'],
        ['otherWordsAt', 'In some Bibles this verse includes words that are alternatively at REF'],
        ['otherText', 'In some Bibles this verse may contain text similar to REF'],
        ['otherTextOrNo', 'Some manuscripts have no text here. Others have text similar to REF'],
        ['otherNo', 'Some manuscripts have no text at REF'],
        ['otherBook', 'In some Bibles this chapter is a separate book'],
        ['otherEmpty', 'In some Bibles this verse may not contain any text'],
        ['empty', 'This verse may not contain any text'],
        ['otherStart', 'In some Bibles this verse starts on a different word'],
        [
            'otherAdd',
            'At the end of this verse, some manuscripts add information such as where this letter was written'
        ]
    ]);

    constructor(rule: IV11nRule) {
        Object.assign(this, rule);
    }

    @AfterLoad()
    parse() {
        this.standardRef = parseReferenceId(this.standardRefId);
        const _sourceRef = parseReferenceId(this.sourceRefId);
        // we think of reference ids to always be normalized. in this special case we encode version
        // numbers in it, so we need to do some manual object conversion
        this.sourceRef = {
            bookOsisId: _sourceRef.bookOsisId,
            versionChapterNum: _sourceRef.normalizedChapterNum,
            versionVerseNum: _sourceRef.normalizedVerseNum,
            versionSubverseNum: _sourceRef.normalizedSubverseNum
        };

        const action = V11nRuleEntity.actionTypes.get(this.actionId);
        if (!action) throw new Error(`invalid actionId ${this.actionId}`);
        this.action = action;
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        // we think of reference ids to always be normalized. in this special case we encode version
        // numbers in it, so we need to do some manual object conversion
        if (this.sourceRef)
            this.sourceRefId = generateReferenceId(
                generateNormalizedRangeFromVersionRange(this.sourceRef)
            );
        if (this.standardRef) this.standardRefId = generateReferenceId(this.standardRef);

        if (this.action) {
            let newActionId: number | undefined;
            for (const [actionId, action] of V11nRuleEntity.actionTypes)
                if (action === this.action) newActionId = actionId;
            if (!newActionId) throw new Error(`invalid action ${this.action}`);
            this.actionId = newActionId;
        }
    }
}
