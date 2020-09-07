import { PassageUrl } from '../models/PassageUrl'

describe('PassageUrl', () => {
    it('accurately breaks up book and chapter and verse', () => {
        const BOOK = 'Matt'
        const CHAPTER = '5'
        const VERSE = '10'
        const PASSAGE = `${BOOK}+${CHAPTER}:${VERSE}`
        const url = new PassageUrl(PASSAGE)
        expect(url.book).toBe(BOOK)
        expect(url.chapter).toBe(CHAPTER)
        expect(url.verse).toBe(VERSE)
    })
})