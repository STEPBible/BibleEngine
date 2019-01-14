import { IBibleReference } from '.';

export interface IV11nRule {
    sourceRef: IBibleReference;
    standardRef: IBibleReference;
    action: 'Keep verse' | 'Merged above' | 'Renumber verse' | 'Empty verse';
    noteMarker: string;
    note: string;
    sourceTypeId: number;
    tests: string;
}
