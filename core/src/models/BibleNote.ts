import { DocumentRoot } from './Document';

export interface IBibleNote {
    type?: string;
    key?: string;
    content: DocumentRoot;
}
