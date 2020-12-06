import { readFileSync, writeFileSync } from 'fs'
const prettifyXML = require('xml-formatter');

const PATH = 'src/bible/osis/data/ESV2016_OSIS+Strongs.xml'
const xmlString = readFileSync(PATH).toString()
console.log('Finished reading file, prettifying XML...')
const prettifiedXml = prettifyXML(xmlString)
console.log('Finished prettifying XML! Saving under the same name...')
writeFileSync(PATH, prettifiedXml)
