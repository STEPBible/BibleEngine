import { Document } from './Document';

export interface IBibleNote {
    type: string;
    key: string;
    content: Document;
}
