import SwordModule from '../src/SwordModule';
import ModuleIndex from '../src/ModuleIndex';

const path = require('path');
const fs = require('fs');

test('XML extraction is correct for Psalms', () => {
    const filename = path.join(__dirname, '../data/KJV.zip');
    const contents = fs.readFileSync(filename);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    const swordModule = new SwordModule(fileIndex);
    const xmlResult = swordModule.getXMLforChapter('Psa 23');
    const expectedResult = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../tests/fixtures/Psa23KjvXmlResult.json'))
    );
    expect(xmlResult).toEqual(expectedResult);
});
