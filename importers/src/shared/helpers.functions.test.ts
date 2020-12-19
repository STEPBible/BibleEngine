import { ImporterBookMetadata } from './Importer.interface';
import { getImporterBookMetadata } from './helpers.functions'

describe('getImporterBookMetadata', () => {
    test('should transform the book metadata into importer format', () => {
        const LANG = 'en'
        const expected: ImporterBookMetadata = new Map()
        expected.set('Ps', {
            abbreviation: 'Ps',
            title: 'Psalm',
            number: 19
        })
        expect(getImporterBookMetadata(LANG).get('Ps')).toEqual(expected.get('Ps'))
    })
})
