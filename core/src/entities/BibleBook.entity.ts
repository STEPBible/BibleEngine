import { Entity, Column, PrimaryColumn, AfterLoad } from 'typeorm';
import { IBibleBookEntity, DocumentRoot } from '../models';

@Entity('bible_book')
export class BibleBookEntity implements IBibleBookEntity {
    @PrimaryColumn()
    versionId: number;

    @PrimaryColumn()
    osisId: string;

    @Column()
    abbreviation: string;

    @Column()
    number: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    longTitle?: string;

    @Column({ nullable: true, type: 'simple-json' })
    introduction?: DocumentRoot;

    @Column({ type: 'varchar' })
    type: IBibleBookEntity['type'];

    @Column({ type: 'simple-array' })
    chaptersCount: number[];

    @Column({ type: 'varchar' })
    dataLocation: IBibleBookEntity['dataLocation'];

    constructor(initializer: IBibleBookEntity) {
        Object.assign(this, initializer);
        if (!this.dataLocation) this.dataLocation = 'db';
    }

    @AfterLoad()
    parse() {
        // typeorm converts values in `simple-array` to strings, we convert it
        // back here and also guard if for empty values here (legacy / typeorm bugs)
        this.chaptersCount = this.chaptersCount && this.chaptersCount.length ? this.chaptersCount.map(n => +n) : [];
    }

    getChapterVerseCount(chapterNumber: number) {
        return this.chaptersCount[chapterNumber - 1] || 0;
    }
}
