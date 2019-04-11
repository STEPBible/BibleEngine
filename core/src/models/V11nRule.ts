import { IBibleReference } from '.';

export interface IV11nRule {
    sourceRef: IBibleReference;
    standardRef: IBibleReference;
    action: 'Keep verse' | 'Merged with' | 'Renumber verse' | 'Empty verse';
    noteMarker: string;
    note: string;
    noteSecondary?: string;
    noteAncientVersions?: string;
    sourceTypeId?: number;
    tests?: string;
}
