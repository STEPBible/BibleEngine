export class PassageUrl {
    book: string
    chapter: string
    verse: string

    static parse(passage: string) {
        const bookAndChapter = passage.split(':')[0];
        const pieces = bookAndChapter.split(/\+|\ /g);
        const book = pieces.slice(0, pieces.length - 1).join('');
        const chapter = pieces[pieces.length - 1];
        const verse = passage.split(':')?.[1];
        return { book, chapter, verse }
    }

    static build(book: string, chapter: string, verse: string) {
        return `${book}+${chapter}:${verse}`
    }
}
