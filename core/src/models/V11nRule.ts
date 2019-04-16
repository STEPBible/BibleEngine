import { IBibleReference } from '.';

export interface IV11nRule {
    // one of `sourceRef` or `sourceRefId` is required
    sourceRef?: IBibleReference;
    sourceRefId?: number;

    // one of `standardRef` or `standardRefId` is required
    standardRef?: IBibleReference;
    standardRefId?: number;

    // one of `action` or `actionId` is required
    action?: 'Keep verse' | 'Merged with' | 'Renumber verse' | 'Empty verse';
    actionId?: number;

    noteMarker: string;
    note: string;
    noteSecondary?: string;
    noteAncientVersions?: string;
    sourceTypeId?: number;
    tests?: string;
}
