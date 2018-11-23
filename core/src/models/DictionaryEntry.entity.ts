import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class DictionaryEntry {
    @PrimaryColumn()
    strong: string;

    @PrimaryColumn()
    dictionary: string;

    @Column()
    lemma?: string;

    @Column()
    transliteration?: string;

    @Column()
    text: string;

    constructor(initializer: DictionaryEntry) {
        if (initializer) Object.assign(this, initializer);
    }
}
