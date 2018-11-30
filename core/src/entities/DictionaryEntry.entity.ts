import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Document, IDictionaryEntry } from '../models';

@Entity()
export class DictionaryEntry implements IDictionaryEntry {
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

    @Column({ nullable: true })
    contentJson?: string;
    content?: Document;

    constructor(dict: IDictionaryEntry) {
        Object.assign(this, dict);
    }

    @AfterLoad()
    parse() {
        if (this.contentJson) this.content = JSON.parse(this.contentJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        if (this.content) this.contentJson = JSON.stringify(this.content);
    }
}
