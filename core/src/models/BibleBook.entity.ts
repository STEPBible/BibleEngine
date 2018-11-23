import { Entity, Column, PrimaryColumn, AfterLoad, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IBibleBook } from './BibleBook.interface';

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

    @Column()
    type: 'ot' | 'nt' | 'ap';

    @Column()
    chaptersMetaJson: string;

    chaptersCount: number[];

    constructor(initializer: Partial<BibleBook>) {
        if (initializer) Object.assign(this, initializer);
    }

    @AfterLoad()
    parseMetaJson() {
        this.chaptersCount = JSON.parse(this.chaptersMetaJson);
    }

    @BeforeInsert()
    @BeforeUpdate()
    async stringifyMetaJson() {
        this.chaptersMetaJson = this.chaptersCount
            ? JSON.stringify(this.chaptersCount)
            : JSON.stringify([]);
    }

    getChapterVerseCount(chapterNumber: number) {
        return this.chaptersCount[chapterNumber - 1];
    }
}
