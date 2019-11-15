import { readFileSync } from 'fs';

import { BibleVersionEntity, IBibleVersion } from '@bible-engine/core';
import { BibleEngineImporter } from '../../../shared/Importer.interface';

import SwordModule from './SwordModule';
import ModuleIndex from './ModuleIndex';
import { BookXML } from './types';
import { getBibleEngineInputFromXML } from './OsisParser';

function getXmlFromModule(filename: string): BookXML[] {
    const contents = readFileSync(filename);
    const fileIndex = ModuleIndex.fromNodeBuffer(contents);
    const swordModule = new SwordModule(fileIndex);
    const booksXML = swordModule.getXMLForVersion();
    return booksXML;
}

export class SwordImporter extends BibleEngineImporter {
    async import() {
        if (!this.options.sourcePath)
            throw new Error(
                `you need to set a sourcePath (2nd paramemter when using BeDatabaseCreator.addImporter)`
            );

        const versionMeta: Partial<IBibleVersion> = this.options.versionMeta || {};
        const version = await this.bibleEngine.addVersion(
            new BibleVersionEntity({
                uid: 'ESV',
                title: 'English Standard Version',
                copyrightShort: '2001 by Crossway Bibles',
                language: 'en-US',
                chapterVerseSeparator: ':',
                hasStrongs: true,
                ...versionMeta
            })
        );

        console.log(`importing version ${version.uid}`);

        const books = getXmlFromModule(this.options.sourcePath);

        for (const book of books) {
            // console.log(book.osisId);
            const bookJson = getBibleEngineInputFromXML(book.chapters);
            await this.bibleEngine.addBookWithContent(version, {
                book: {
                    number: book.bookNum,
                    osisId: book.osisId,
                    abbreviation: book.osisId,
                    title: book.fullName,
                    type: book.bookNum < 40 ? 'ot' : 'nt'
                },
                contents: bookJson
            });
        }
        return this.bibleEngine.finalizeVersion(version.id);
    }

    toString() {
        return 'SwordImporter';
    }
}
