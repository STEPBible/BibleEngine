import { Entity, Column, PrimaryColumn } from 'typeorm';
import { IDictionaryEntry } from '../models';

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

    @Column({ nullable: true })
    pronunciation?: string;

    @Column()
    gloss: string;

    @Column({ nullable: true })
    content?: string;

    constructor(dict: IDictionaryEntry) {
        Object.assign(this, dict);
    }
}
