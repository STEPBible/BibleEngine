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
    generateNormalizedReferenceFromVersionRange,
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

    @Column()
    sourceTypeId: number;

    @Column()
    noteMarker: string;

    @Column()
    note: string;

    @Column()
    tests: string;

    static actionTypes = new Map<number, IV11nRule['action']>([
        [1, 'Keep verse'],
        [2, 'Renumber verse'],
        [3, 'Merged above'],
        [4, 'Empty verse']
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
        this.sourceRefId = generateReferenceId(
            generateNormalizedReferenceFromVersionRange(this.sourceRef)
        );
        this.standardRefId = generateReferenceId(this.standardRef);
        let newActionId: number | undefined;
        for (const [actionId, action] of V11nRuleEntity.actionTypes)
            if (action === this.action) newActionId = actionId;
        if (!newActionId) throw new Error(`invalid action ${this.action}`);
        this.actionId = newActionId;
    }
}
