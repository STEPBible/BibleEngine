import { PassageUrl } from '../models/PassageUrl'

describe('PassageUrl', () => {
    const BOOK = 'Matt'
    const CHAPTER = '15'
    const VERSE = '10'
    it('accurately breaks up book and chapter and verse', () => {
        const SEPARATOR = '+'
        const PASSAGE = `${BOOK}${SEPARATOR}${CHAPTER}:${VERSE}`
        const { book, chapter, verse } = PassageUrl.parse(PASSAGE)
        expect(book).toBe(BOOK)
        expect(chapter).toBe(CHAPTER)
        expect(verse).toBe(VERSE)
    })
    it(`Supports spaces as a separator, too`, () => {
        const SEPARATOR = ' '
        const PASSAGE = `${BOOK}${SEPARATOR}${CHAPTER}:${VERSE}`
        const { book, chapter, verse } = PassageUrl.parse(PASSAGE)
        expect(book).toBe(BOOK)
        expect(chapter).toBe(CHAPTER)
        expect(verse).toBe(VERSE)
    })
})

describe('build', () => {
    it(`constructs a url out of book, chapter, verse`, () => {
        const BOOK = 'Matt'
        const CHAPTER = '5'
        const VERSE = '10'
        const url = PassageUrl.build(BOOK, CHAPTER, VERSE)
        expect(url).toBe(`${BOOK}+${CHAPTER}:${VERSE}`)
    })
})