import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BeforeInsert,
    BeforeUpdate,
    Index,
    UpdateDateColumn
} from 'typeorm';
import { DocumentRoot, IBibleVersion } from '../models';

@Entity('bible_version')
export class BibleVersionEntity implements IBibleVersion {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column()
    uid: string;

    @Column()
    title: string;

    @Column({ nullable: true, type: 'simple-json' })
    description?: DocumentRoot;

    @Column({ length: 5 })
    language: string;

    @Column({ nullable: true })
    copyrightShort?: string;

    @Column({ nullable: true, type: 'simple-json' })
    copyrightLong?: DocumentRoot;

    @Column()
    chapterVerseSeparator: string;

    @Column({ nullable: true })
    hasStrongs?: boolean;

    @Column({ nullable: true })
    isPlaintext?: boolean;

    @Column({nullable: true, type: 'varchar'})
    type?: IBibleVersion['type'];

    @UpdateDateColumn()
    lastUpdate: Date;

    @Column({ type: 'varchar' })
    dataLocation?: 'db' | 'file' | 'remote';

    constructor(initializer: IBibleVersion) {
        Object.assign(this, initializer);
        if (!this.dataLocation) this.dataLocation = 'db';
    }

    // @AfterLoad()
    // parse() {
    //     if (this.descriptionJson) this.description = JSON.parse(this.descriptionJson);
    //     if (this.copyrightLongJson) this.copyrightLong = JSON.parse(this.copyrightLongJson);
    // }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        // if (this.description) this.descriptionJson = JSON.stringify(this.description);
        // if (this.copyrightLong) this.copyrightLongJson = JSON.stringify(this.copyrightLong);
    }
}
