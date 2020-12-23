import SwordModule from '../src/SwordModule';
import ModuleIndex from '../src/ModuleIndex';
import VerseScheme from '../src/VerseScheme';

const path = require('path');
const fs = require('fs');

const filename = path.join(__dirname, '../tests/fixtures/KJV.zip');
const contents = fs.readFileSync(filename);
const fileIndex = ModuleIndex.fromNodeBuffer(contents);
const swordModule = new SwordModule(fileIndex);

describe('getXMLforChapter', () => {
    it('XML extraction is correct for Psalms', () => {
        const xmlResult = swordModule.getXMLforChapter('Psa 23');
        const expectedResult = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../tests/fixtures/Psa23KjvXmlResult.json'))
        );
        expect(xmlResult).toEqual(expectedResult);
    });
})

describe('getAvailableOsisBookNames', () => {
    it('can extract available books, even if its only subset of versification schema', () => {
        const versificationBookNames = VerseScheme.getAllBookOsisNames()
        const availableNames = swordModule.getAvailableOsisBookNames()
        expect(versificationBookNames).toStrictEqual(availableNames)
    })
})
