// import { BibleEngine } from '../../BibleEngine.class';
import { resolve } from 'path';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { IBibleReference } from '@bible-engine/core';

// const dirProjectRoot = resolve(__dirname + '/../../..');

// const sqlBible = new BibleEngine({
//     type: 'sqlite',
//     database: `${dirProjectRoot}/output/bible.db`
// });

const bookNum2Osis: Map<number, string> = new Map([
    [1, 'Gen'],
    [2, 'Exod'],
    [3, 'Lev'],
    [4, 'Num'],
    [5, 'Deut'],
    [6, 'Josh'],
    [7, 'Judg'],
    [8, 'Ruth'],
    [9, '1Sam'],
    [10, '2Sam'],
    [11, '1Kgs'],
    [12, '2Kgs'],
    [13, '1Chr'],
    [14, '2Chr'],
    [15, 'Ezra'],
    [16, 'Neh'],
    [17, 'Esth'],
    [18, 'Job'],
    [19, 'Ps'],
    [20, 'Prov'],
    [21, 'Eccl'],
    [22, 'Song'],
    [23, 'Isa'],
    [24, 'Jer'],
    [25, 'Lam'],
    [26, 'Ezek'],
    [27, 'Dan'],
    [28, 'Hos'],
    [29, 'Joel'],
    [30, 'Amos'],
    [31, 'Obad'],
    [32, 'Jonah'],
    [33, 'Mic'],
    [34, 'Nah'],
    [35, 'Hab'],
    [36, 'Zeph'],
    [37, 'Hag'],
    [38, 'Zech'],
    [39, 'Mal'],
    [40, 'Matt'],
    [41, 'Mark'],
    [42, 'Luke'],
    [43, 'John'],
    [44, 'Acts'],
    [45, 'Rom'],
    [46, '1Cor'],
    [47, '2Cor'],
    [48, 'Gal'],
    [49, 'Eph'],
    [50, 'Phil'],
    [51, 'Col'],
    [52, '1Thess'],
    [53, '2Thess'],
    [54, '1Tim'],
    [55, '2Tim'],
    [56, 'Titus'],
    [57, 'Phlm'],
    [58, 'Heb'],
    [59, 'Jas'],
    [60, '1Pet'],
    [61, '2Pet'],
    [62, '1John'],
    [63, '2John'],
    [64, '3John'],
    [65, 'Jude'],
    [66, 'Rev'],
]);

const line2Ref: Map<number, string> = new Map();
const rdIndex = createInterface({ input: createReadStream(resolve(__dirname) + '/index.ont') });
let lineNr = 1;
rdIndex.on('line', (line) => {
    line2Ref.set(lineNr, line);
    lineNr++;
});
rdIndex.on('close', () => {
    parseBible();
});

const getReferenceFromLineNr = (nr: number): IBibleReference | false => {
    const refNumString = line2Ref.get(nr);
    if (!refNumString) return false;
    // throw new Error(`there is no reference index for line ${nr}`);

    const [bookNum, chapterNum, verseNum] = refNumString.split('|');
    const bookOsisId = bookNum2Osis.get(+bookNum);
    if (!bookOsisId) throw new Error(`invalid book number ${bookNum}`);

    return {
        bookOsisId,
        versionChapterNum: +chapterNum,
        versionVerseNum: +verseNum,
    };
};

const parseBible = () => {
    let lineNrBible = 1;
    const rdBible = createInterface({
        input: createReadStream(resolve(__dirname) + '/NeÜ bibel.heute.ont'),
    });
    rdBible.on('line', (line) => {
        const ref = getReferenceFromLineNr(lineNrBible);
        if (ref) {
            console.log(
                `parsing reference ${ref.bookOsisId} ${ref.versionChapterNum}:${ref.versionVerseNum}`
            );
        } else {
            console.log(`line is not a reference: ${line}`);
        }
        lineNrBible++;
    });

    rdBible.on('close', () => {
        console.log(`finished parsing bible`);
    });
};
