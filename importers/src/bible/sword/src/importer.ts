import { readFileSync } from 'fs';

import { BibleEngineImporter } from '../../../shared/Importer.interface';
import SwordModule from './SwordModule';
import ModuleIndex from './ModuleIndex';
import { OsisImporter } from './../../osis/index';

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
            const xml = swordModule.getSingleXMLDocumentForVersion()

            const importer = new OsisImporter(
                this.bibleEngine,
                {
                    sourceData: xml,
                    versionMeta: {
                        uid: swordModule.config.moduleName,
                        hasStrongs: swordModule.config.hasStrongs,
                        abbreviation: swordModule.config.moduleName,
                        title: swordModule.config.description,
                        language: swordModule.config.language,
                        copyrightShort: swordModule.config.shortCopyright,
                    },
                    bookMeta: swordModule.getBookMetadata()
                }
            )
            await importer.run()
        } catch (error) {
            console.log(`${this.toString()} failed`, error)
            throw error
        }
    }

    toString() {
        return 'SwordImporter';
    }
}
