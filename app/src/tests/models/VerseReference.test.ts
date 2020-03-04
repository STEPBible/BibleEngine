import VerseReference from '../../models/VerseReference'

describe('VerseReference', () => {
  const ref = new VerseReference('Gen 23:16', 'ESV')

  test('Book osis id is parsed', () => {
    expect(ref.bookOsisId).toBe('Gen')
  })
  test('book chapter num is parsed', () => {
    expect(ref.versionChapterNum).toBe(23)
  })
  test('book verse number is parsed', () => {
    expect(ref.versionVerseNum).toBe(16)
  })
  test('Generated range is marked normalized, to speed up results', () => {
    expect(ref.range).toEqual({
      ...ref,
    })
  })
})
