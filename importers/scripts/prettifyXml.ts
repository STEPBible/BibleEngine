import { readFileSync, writeFileSync } from 'fs'
const prettifyXML = require('xml-formatter');

if (!process.env.XML_PATH) {
    throw new Error('Missing required XML_PATH argment')
}
const xmlString = readFileSync(process.env.XML_PATH).toString()
console.log('Finished reading file, prettifying XML...')
const prettifiedXml = prettifyXML(xmlString)
console.log('Finished prettifying XML, saving under the same name...')
writeFileSync(process.env.XML_PATH, prettifiedXml)
