import { readFileSync } from 'fs';
const prettifyXML = require('xml-formatter');

import ModuleIndex from '../src/bible/sword/src/ModuleIndex';
import SwordModule from '../src/bible/sword/src/SwordModule';

const IMPORT_PATH = 'src/bible/sword/data/ESV2016_th.zip'
const REFERENCE = `${process.env.BOOK} ${process.env.CHAPTER}`

const main = async () => {
    const contents = readFileSync(IMPORT_PATH);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    const swordModule = new SwordModule(fileIndex);
    const xml = swordModule.getXMLforChapter(REFERENCE);
    if (!xml) {
        throw new Error('book or chapter not found')
    }
    const verse = xml.verses.find(
        xmlVerse => Number(xmlVerse.verse) === Number(process.env.VERSE)
    )
    if (!verse) {
        throw new Error('verse not found')
    }
    const textWithSingleRootNode = `<xml>${verse.text}</xml>`;
    console.log(prettifyXML(textWithSingleRootNode))
}

main().catch(error => console.log('Got an error: ', error.message))
