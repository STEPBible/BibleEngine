import SwordModule from '../src/SwordModule';
import ModuleIndex from '../src/ModuleIndex';

const fs = require('fs');

test('XML extraction is correct for Psalms', () => {
    const filename = './data/KJV.zip';
    const contents = fs.readFileSync(filename);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    const swordModule = new SwordModule(fileIndex);
    const xmlResult = swordModule.getXMLforChapter('Psa 23');
    const expectedResult = JSON.parse(fs.readFileSync('./tests/Psa23KjvXmlResult.json'));
    expect(xmlResult).toEqual(expectedResult);
});
