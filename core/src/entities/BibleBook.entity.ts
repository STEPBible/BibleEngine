import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IBibleBook, Document } from '../models';

@Entity()
export class BibleBook implements IBibleBook {
    @PrimaryColumn()
    versionId: number;

    @PrimaryColumn()
    osisId: string;

    @Column()
    number: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    introductionJson: string;

    introduction: Document;

    @Column()
    type: 'ot' | 'nt' | 'ap';

    @Column()
    chaptersMetaJson: string;

    chaptersCount: number[];

    constructor(initializer: IBibleBook) {
        Object.assign(this, initializer);
    }

    @AfterLoad()
    parse() {
        this.chaptersCount = JSON.parse(this.chaptersMetaJson);
        if (this.introductionJson) this.introduction = JSON.parse(this.introductionJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async prepare() {
        this.chaptersMetaJson = JSON.stringify(this.chaptersCount);
        if (this.introduction) this.introductionJson = JSON.stringify(this.introduction);
    }

    getChapterVerseCount(chapterNumber: number) {
        return this.chaptersCount[chapterNumber - 1];
    }
}
