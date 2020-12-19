import { BOOK_DATA, OT_BOOKS, NT_BOOKS } from '@bible-engine/core'
import { ImporterBookMetadata } from './Importer.interface'

export function startsWithPunctuationChar(string: string) {
    return ['.', ',', ':', '?', '!', ';'].indexOf(string.trim().slice(0, 1)) !== -1;
}

export function matchAll(string: string, regexp: RegExp) {
    if (typeof string !== 'string') {
        return null;
    }
    const matches: RegExpMatchArray[] = [];
    string.replace(regexp, function () {
        const arr: any = [].slice.call(arguments, 0);
        const extras = arr.splice(-2);
        arr.index = extras[0];
        arr.input = extras[1];
        matches.push(arr);
        return arr[0];
    });
    return matches.length ? matches : null;
}

export function streamToString(stream: NodeJS.ReadWriteStream): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((_resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => _resolve(Buffer.concat(chunks).toString('utf8')));
    });
}


export const getImporterBookMetadata = (lang: string): ImporterBookMetadata => {
    const books = [...OT_BOOKS, ...NT_BOOKS]
    const importerBookMetadata: ImporterBookMetadata = new Map()
    for (const bookName of books) {
        importerBookMetadata.set(bookName, {
            abbreviation: bookName,
            number: BOOK_DATA[bookName].genericId,
            title: BOOK_DATA[bookName].names[lang][0]
        })
    }
    return importerBookMetadata
}
