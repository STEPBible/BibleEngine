import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseStringPromise } from 'xml2js';

import { BibleEngineImporter, ImporterBookMetadataBook } from '../../shared/Importer.interface';

import {
    BookWithContentForInput,
    BOOK_DATA,
    ContentGroupType,
    DocumentGroup,
    DocumentPhrase,
    IBibleBook,
    IBibleCrossReference,
    IBibleReference,
    IBibleVersion,
    NT_BOOKS,
    OT_BOOKS,
} from '@bible-engine/core';
import { UsxImporter } from '../usx';
import { ITagWithType, ParserStackItem, TagType } from './types';

interface IParserContext {
    version?: IBibleVersion;
    books: BookWithContentForInput[];
    currentBook?: IBibleBook;
    currentChapter?: number;
    currentVerse?: number;
    crossRefBuffer?: {
        key?: string;
        refs: IBibleCrossReference[];
    };
    strongsBuffer?: string[];
    contentContainerStack: ParserStackItem[];
    hierarchicalTagStack: ITagWithType[];
    currentVerseJoinToVersionRef?: IBibleReference;
    openedSelfClosingTag?: ITagWithType;
    skipClosingTags: TagType[];
    sectionStack: any[];
}

type XHTMLNodeType = '__text__' | 'p' | 'a' | 'em';
interface IXHTMLNode<T extends XHTMLNodeType> {
    readonly '#name': T;
    $: T extends 'a' ? { href: string } : undefined;
    $$: T extends 'p' ? IXHTMLNode<XHTMLNodeType>[] | undefined : undefined;
    _: T extends 'p' ? undefined : string;
}

function genDocumentElementsFromXHTMLNodes(
    nodes: IXHTMLNode<XHTMLNodeType>[]
): (DocumentPhrase | DocumentGroup<ContentGroupType>)[] {
    const contents: (DocumentPhrase | DocumentGroup<ContentGroupType>)[] = [];
    for (const node of nodes) {
        switch (node['#name']) {
            case '__text__':
                contents.push({ content: (node as IXHTMLNode<'__text__'>)._ });
                break;
            case 'a':
                contents.push({
                    type: 'group',
                    groupType: 'link',
                    modifier: (node as IXHTMLNode<'a'>).$.href,
                    contents: [{ content: (node as IXHTMLNode<'a'>)._ }],
                });
                break;
            case 'em':
                contents.push({
                    type: 'group',
                    groupType: 'emphasis',
                    contents: [{ content: (node as IXHTMLNode<'em'>)._ }],
                });
                break;
            case 'p':
                if (node.$$)
                    contents.push({
                        type: 'group',
                        groupType: 'paragraph',
                        contents: genDocumentElementsFromXHTMLNodes(node.$$),
                    });
                break;
        }
    }
    return contents;
}

function genPlaintextFromXHTMLNodes(nodes: IXHTMLNode<XHTMLNodeType>[]): string {
    let text = '';
    for (const node of nodes) {
        switch (node['#name']) {
            case 'p':
                if (node.$$) text += ' ' + genPlaintextFromXHTMLNodes(node.$$);
                break;
            default:
                text += ' ' + node._;
                break;
        }
    }
    return text.slice(1);
}

/**
 * returns the character that separates chapter and verses in the given language. Currently this
 * returns ':' for most languages. For RTL languages, a special unicode character is appended
 * that prevents the text direction to flip within the reference.
 */
function getChapterVerseSeparatorFromLanguage(language: string, direction: 'LTR' | 'RTL' = 'LTR') {
    const langNormalized = language.slice(0, 2);
    let separator: string | undefined;
    // RADAR: this needs research
    switch (langNormalized) {
        case 'de':
        case 'hr':
            separator = ',';
            break;
        case 'fr':
        case 'ru':
            separator = '.';
            break;
    }
    return `${separator || ':'}${direction === 'RTL' ? '\u200f' : ''}`;
}

export class DblImporter extends BibleEngineImporter {
    async import() {
        let xml: string;
        const sourceDir = this.options.sourcePath || resolve(__dirname) + '/data';
        if (this.options.sourceData) xml = this.options.sourceData;
        else {
            const sourcePath = `${sourceDir}/metadata.xml`;
            xml = readFileSync(sourcePath, 'utf8');
        }

        // we parse the metadata file two times so that we can make use of a more sane parser
        // config for the key-value data
        const parsedMetadata: {
            identification: {
                name: string;
                nameLocal: string;
                description: string;
                abbreviation: string;
                abbreviationLocal?: string;
            };
            type: {
                audience?: 'Basic' | 'Common' | 'Common - Literary' | 'Literary' | 'Liturgical';
            };
            language: {
                iso: string;
                name: string;
                nameLocal: string;
                scriptDirection: 'LTR' | 'RTL';
                ldml: string;
            };
            names: {
                name: [
                    {
                        id: string;
                        abbr: string;
                        short: string;
                        long: string;
                    }
                ];
            };
            publications: {
                publication: {
                    structure: {
                        content: [
                            {
                                name: string;
                                src: string;
                                role: string;
                            }
                        ];
                    };
                };
            };
        } = await parseStringPromise(xml, {
            explicitRoot: false,
            explicitArray: false,
            mergeAttrs: true,
        });

        const parsedCopyright: {
            copyright: {
                fullStatement?: {
                    statementContent: { $$: IXHTMLNode<XHTMLNodeType>[] };
                };
                statement?: {
                    $$: IXHTMLNode<XHTMLNodeType>[];
                };
            };
            promotion: {
                promoVersionInfo: { $$: IXHTMLNode<XHTMLNodeType>[] };
            };
        } = await parseStringPromise(xml, {
            explicitRoot: false,
            explicitArray: false,
            mergeAttrs: false,
            explicitChildren: true,
            preserveChildrenOrder: true,
            charsAsChildren: true,
        });

        const bookMeta: Map<string, ImporterBookMetadataBook & { sourcePath: string }> = new Map();
        for (const osisId of OT_BOOKS.concat(NT_BOOKS)) {
            const paratextId = BOOK_DATA[osisId]!.paratextId;
            const bookIndex = parsedMetadata.publications.publication.structure.content.findIndex(
                (metaStructureBook) => metaStructureBook.role === paratextId
            );
            if (bookIndex === -1) throw new Error(`missing book for paratextId ${paratextId}`);
            const metaStructureBook = parsedMetadata.publications.publication.structure.content[
                bookIndex
            ]!;
            const metaBookName = parsedMetadata.names.name.find(
                (metaName) => metaName.id === metaStructureBook.name
            );
            if (!metaBookName)
                throw new Error(`missing book name metadata for ${metaStructureBook.name}`);
            bookMeta.set(osisId, {
                number: bookIndex + 1,
                abbreviation: metaBookName.abbr,
                title: metaBookName.short,
                longTitle: metaBookName.long,
                sourcePath: `${sourceDir}/${metaStructureBook.src}`,
            });
        }

        const versionMeta: IBibleVersion = {
            uid: parsedMetadata.identification.abbreviation,
            abbreviation: parsedMetadata.identification.abbreviationLocal,
            title: parsedMetadata.identification.nameLocal,
            language: parsedMetadata.language.ldml,
            chapterVerseSeparator: getChapterVerseSeparatorFromLanguage(
                parsedMetadata.language.ldml,
                parsedMetadata.language.scriptDirection
            ),
            description: {
                type: 'root',
                contents: genDocumentElementsFromXHTMLNodes(
                    parsedCopyright.promotion.promoVersionInfo.$$
                ),
            },
            type:
                parsedMetadata.type.audience === 'Literary' ||
                parsedMetadata.type.audience === 'Liturgical'
                    ? 'formal'
                    : 'dynamic',
            ...this.options.versionMeta,
        };

        if (parsedCopyright.copyright.fullStatement?.statementContent) {
            versionMeta.copyrightLong = {
                type: 'root',
                contents: genDocumentElementsFromXHTMLNodes(
                    parsedCopyright.copyright.fullStatement.statementContent.$$
                ),
            };
        }
        if (parsedCopyright.copyright.statement) {
            versionMeta.copyrightShort = genPlaintextFromXHTMLNodes(
                parsedCopyright.copyright.statement.$$
            );
        } else if (parsedCopyright.copyright.fullStatement?.statementContent) {
            // RADAR: this is a hack, since our data from Biblica is missing a dedicated
            //        attribute for short copyright, however in the data we received up until
            //        now it is always the second line in the long copyright text.
            const shortCopyrightLine = parsedCopyright.copyright.fullStatement.statementContent.$$.find(
                ({ _ }) => _?.indexOf('©') !== -1
            );
            if (shortCopyrightLine)
                versionMeta.copyrightShort = genPlaintextFromXHTMLNodes([shortCopyrightLine]);
        }

        const usxImporter = new UsxImporter(this.bibleEngine, {
            ...this.options,
            versionMeta: {
                ...versionMeta,
                ...this.options.versionMeta,
            },
            bookMeta,
        });

        return usxImporter.run();
    }

    log(msg: any, _context?: IParserContext) {
        console.log(msg);
    }

    toString() {
        return 'DBL';
    }
}
