import SwordModule from '../src/SwordModule';
import ModuleIndex from '../src/ModuleIndex';
import VerseScheme from '../src/VerseScheme';

const path = require('path');
const fs = require('fs');

const getSwordModule = (filePath: string) => {
    const filename = path.join(__dirname, filePath);
    const contents = fs.readFileSync(filename);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    return new SwordModule(fileIndex);
}

const kjvBible = getSwordModule('./fixtures/KJV.zip')
const greekNewTestament = getSwordModule('./fixtures/sblg-the.zip')

describe('getXMLforChapter', () => {
    it('XML extraction is correct for Psalms', () => {
        const xmlResult = kjvBible.getXMLforChapter('Psa 23');
        const expectedResult = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../tests/fixtures/Psa23KjvXmlResult.json'))
        );
        expect(xmlResult).toEqual(expectedResult);
    });
})

describe('getAvailableOsisBookNames', () => {
    it('can extract available books, even if its only subset of versification schema', () => {
        const versificationBookNames = VerseScheme.getNTBookOsisNames()
        const availableNames = greekNewTestament.getAvailableOsisBookNames()
        expect(versificationBookNames).toStrictEqual(availableNames)
    })
})

describe('getBookMetadata', () => {
    it(`maps book names correctly for New Testament-only translations`, () => {
        const metadata = greekNewTestament.getBookMetadata()
        expect(metadata.get('Matt')).toEqual({
            abbreviation: 'Matt',
            title: 'Matthew',
            number: 0,
        })
    })
})
