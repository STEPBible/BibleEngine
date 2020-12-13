import { IBibleReferenceRange } from "@bible-engine/core";

export function getParsedBookChapterVerseRef(osisRef: string): IBibleReferenceRange {
    const firstVerse = osisRef.split('-')[0].split('.');
    const bookOsisId = firstVerse[0];
    const versionChapterNum = Number(firstVerse[1]);
    const range: IBibleReferenceRange = {
        bookOsisId,
        versionChapterNum
    };
    if (firstVerse[2]) range.versionVerseNum = +firstVerse[2];
    const hasMultipleVerses = osisRef.split('-').length === 2;
    if (hasMultipleVerses) {
        const secondVerse = osisRef.split('-')[1];
        range.versionVerseEndNum = Number(secondVerse.split('.')[2]);
    }
    return range;
}