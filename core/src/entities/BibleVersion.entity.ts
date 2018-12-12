import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    AfterLoad,
    BeforeInsert,
    BeforeUpdate,
    Index
} from 'typeorm';
import { Document, IBibleVersion } from '../models';

@Entity()
export class BibleVersion implements IBibleVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    version: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    descriptionJson?: string;
    description?: Document;

    @Column({ length: 5 })
    language: string;

    @Column({ nullable: true })
    copyrightShort?: string;

    @Column({ nullable: true })
    copyrightLongJson?: string;
    copyrightLong?: Document;

    @Column()
    chapterVerseSeparator: string;

    @Column({ nullable: true })
    hasStrongs?: boolean;

    constructor(initializer: IBibleVersion) {
        Object.assign(this, initializer);
    }

    @AfterLoad()
    parse() {
        if (this.descriptionJson) this.description = JSON.parse(this.descriptionJson);
        if (this.copyrightLongJson) this.copyrightLong = JSON.parse(this.copyrightLongJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        if (this.description) this.descriptionJson = JSON.stringify(this.description);
        if (this.copyrightLong) this.copyrightLongJson = JSON.stringify(this.copyrightLong);
    }
}
