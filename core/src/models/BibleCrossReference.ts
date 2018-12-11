import { IBibleReferenceRange } from './BibleReference';

export interface IBibleCrossReference {
    key: string;
    range: IBibleReferenceRange;
    label?: string;
}
