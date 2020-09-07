export class PassageUrl {
    book: string
    chapter: string
    verse: string

    constructor(passage: string) {
        const bookAndChapter = passage.split(':')[0];
        const pieces = bookAndChapter.split('+');
        this.book = pieces.slice(0, pieces.length - 1).join('');
        this.chapter = pieces[pieces.length - 1];
        this.verse = passage.split(':')?.[1];
    }
}