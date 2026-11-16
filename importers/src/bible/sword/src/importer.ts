import { readFileSync } from 'fs';

import { BibleEngineImporter } from '../../../shared/Importer.interface.js';
import SwordModule from './SwordModule.js';
import ModuleIndex from './ModuleIndex.js';
import { OsisImporter } from './../../osis/index.js';
import { OsisXmlNodeName } from '../../../shared/osisTypes.js';

export class SwordImporter extends BibleEngineImporter {
    async import() {
        try {
            if (!this.options.sourcePath) {
                throw new Error(
                    `you need to set a sourcePath (2nd parameter when using BeDatabaseCreator.addImporter)`
                );
            }
            const contents = readFileSync(this.options.sourcePath);
            const fileIndex = ModuleIndex.fromNodeBuffer(contents);
            const swordModule = new SwordModule(fileIndex);
            const xml = swordModule.getSingleXMLDocumentForVersion();
            const hasStrongs = xml.includes('<w lemma="strong:');
            const isPlaintext =
                !xml.includes(`<${OsisXmlNodeName.PARAGRAPH}>`) &&
                !xml.includes(`<${OsisXmlNodeName.TITLE}>`);
            const importer = new OsisImporter(this.bibleEngine, {
                sourceData: xml,
                versionMeta: {
                    hasStrongs,
                    isPlaintext,
                    uid: swordModule.config.moduleName,
                    abbreviation: swordModule.config.moduleName,
                    title: swordModule.config.description,
                    language: swordModule.config.language,
                    copyrightShort: swordModule.config.shortCopyright,
                    ...this.options.versionMeta,
                },
                bookMeta: this.options.bookMeta || swordModule.getBookMetadata(),
                autoGenMissingParagraphs: this.options.autoGenMissingParagraphs,
            });
            await importer.run();
        } catch (error) {
            console.log(`${this.toString()} failed`, error);
            throw error;
        }
    }

    toString() {
        return 'SwordImporter';
    }
}
