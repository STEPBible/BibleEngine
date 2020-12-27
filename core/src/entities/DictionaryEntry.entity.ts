import { Entity, Column, PrimaryColumn } from 'typeorm';
import { IDictionaryEntry, DocumentRoot } from '../models';

@Entity('dictionary_entry')
export class DictionaryEntryEntity implements IDictionaryEntry {
    @PrimaryColumn()
    strong: string;

    @PrimaryColumn()
    dictionary: string;

    @Column({ nullable: true })
    lemma?: string;

    @Column({ nullable: true })
    transliteration?: string;

    @Column()
    gloss: string;

    @Column({ nullable: true, type: 'simple-json' })
    content?: DocumentRoot;

    constructor(dict: IDictionaryEntry) {
        Object.assign(this, dict);
    }
}
