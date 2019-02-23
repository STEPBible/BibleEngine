import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate } from '../typeorm';
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

    @Column({ nullable: true, type: 'text' })
    contentJson?: string;
    content?: DocumentRoot;

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
