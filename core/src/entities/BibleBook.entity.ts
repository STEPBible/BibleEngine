import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate } from 'typeorm';
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

    @Column({ nullable: true, type: 'text' })
    introductionJson?: string;

    introduction?: DocumentRoot;

    @Column({ type: 'varchar' })
    type: IBibleBookEntity['type'];

    @Column({ type: 'text' })
    chaptersMetaJson: string;

    chaptersCount: number[];

    @Column({ type: 'varchar' })
    dataLocation: IBibleBookEntity['dataLocation'];

    constructor(initializer: IBibleBookEntity) {
        Object.assign(this, initializer);
        if (!this.dataLocation) this.dataLocation = 'db';
    }

    @AfterLoad()
    parse() {
        if (this.chaptersMetaJson) this.chaptersCount = JSON.parse(this.chaptersMetaJson);
        if (this.introductionJson) this.introduction = JSON.parse(this.introductionJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        if (this.chaptersCount) this.chaptersMetaJson = JSON.stringify(this.chaptersCount);
        if (this.introduction) this.introductionJson = JSON.stringify(this.introduction);
    }

    getChapterVerseCount(chapterNumber: number) {
        return this.chaptersCount[chapterNumber - 1];
    }
}
