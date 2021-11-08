import { BibleBookPlaintext } from '../models';

/**
 * @description OSIS book ID with chapter/verse statistics and English names
 */
export type BookData = {
    [key: string]: { genericId: number; names: { [key: string]: string[] } };
};
export const BOOK_DATA: BookData = {
    /*
     Old Testament
    */
    Gen: {
        genericId: 1,
        names: { en: ['Genesis', 'Ge', 'Gen'] },
    },
    Exod: {
        genericId: 2,
        names: { en: ['Exodus', 'Ex', 'Exo'] },
    },
    Lev: {
        genericId: 3,
        names: { en: ['Leviticus', 'Le', 'Lev'] },
    },
    Num: {
        genericId: 4,
        names: { en: ['Numbers', 'Nu', 'Num'] },
    },
    Deut: {
        genericId: 5,
        names: { en: ['Deuteronomy', 'Dt', 'Deut', 'Deu', 'De'] },
    },
    Josh: {
        genericId: 6,
        names: { en: ['Joshua', 'Js', 'Jos', 'Jos', 'Josh'] },
    },
    Judg: {
        genericId: 7,
        names: { en: ['Judges', 'Jg', 'Jdg', 'Jdgs'] },
    },
    Ruth: {
        genericId: 8,
        names: { en: ['Ruth', 'Ru', 'Rut'] },
    },
    '1Sam': {
        genericId: 9,
        names: {
            en: ['1 Samuel', '1S', '1 Sam', '1Sam', '1 Sa', '1Sa', 'I Samuel', 'I Sam', 'I Sa'],
        },
    },
    '2Sam': {
        genericId: 10,
        names: {
            en: [
                '2 Samuel',
                '2S',
                '2 Sam',
                '2Sam',
                '2 Sa',
                '2Sa',
                'II Samuel',
                'II Sam',
                'II Sa',
                'IIS',
            ],
        },
    },
    '1Kgs': {
        genericId: 11,
        names: {
            en: ['1 Kings', '1K', '1 Kin', '1Kin', '1 Ki', 'IK', '1Ki', 'I Kings', 'I Kin', 'I Ki'],
        },
    },
    '2Kgs': {
        genericId: 12,
        names: {
            en: [
                '2 Kings',
                '2K',
                '2 Kin',
                '2Kin',
                '2 Ki',
                'IIK',
                '2Ki',
                'II Kings',
                'II Kin',
                'II Ki',
            ],
        },
    },
    '1Chr': {
        genericId: 13,
        names: {
            en: [
                '1 Chronicles',
                '1Ch',
                '1 Chr',
                '1Chr',
                '1 Ch',
                'ICh',
                'I Chronicles',
                'I Chr',
                'I Ch',
            ],
        },
    },
    '2Chr': {
        genericId: 14,
        names: {
            en: [
                '2 Chronicles',
                '2Ch',
                '2 Chr',
                '2 Chr',
                '2Chr',
                '2 Ch',
                'IICh',
                'II Chronicles',
                'II Chr',
                'II Ch',
            ],
        },
    },
    Ezra: {
        genericId: 15,
        names: { en: ['Ezra', 'Ezr'] },
    },
    Neh: {
        genericId: 16,
        names: { en: ['Nehemiah', 'Ne', 'Neh', 'Neh', 'Ne'] },
    },
    Esth: {
        genericId: 17,
        names: { en: ['Esther', 'Es', 'Est', 'Esth'] },
    },
    Job: {
        genericId: 18,
        names: { en: ['Job', 'Jb', 'Job'] },
    },
    Ps: {
        genericId: 19,
        names: { en: ['Psalm', 'Ps', 'Psa'] },
    },
    Prov: {
        genericId: 20,
        names: { en: ['Proverbs', 'Pr', 'Prov', 'Pro'] },
    },
    Eccl: {
        genericId: 21,
        names: { en: ['Ecclesiastes', 'Ec', 'Ecc', 'Qohelet'] },
    },
    Song: {
        genericId: 22,
        names: {
            en: [
                'Song of Songs',
                'So',
                'Sos',
                'Song of Solomon',
                'SOS',
                'SongOfSongs',
                'SongofSolomon',
                'Canticle of Canticles',
                'Sng',
            ],
        },
    },
    Isa: {
        genericId: 23,
        names: { en: ['Isaiah', 'Is', 'Isa'] },
    },
    Jer: {
        genericId: 24,
        names: { en: ['Jeremiah', 'Je', 'Jer'] },
    },
    Lam: {
        genericId: 25,
        names: { en: ['Lamentations', 'La', 'Lam', 'Lament'] },
    },
    Ezek: {
        genericId: 26,
        names: { en: ['Ezekiel', 'Ek', 'Ezek', 'Eze', 'Ezk'] },
    },
    Dan: {
        genericId: 27,
        names: { en: ['Daniel', 'Da', 'Dan', 'Dl', 'Dnl'] },
    },
    Hos: {
        genericId: 28,
        names: { en: ['Hosea', 'Ho', 'Hos'] },
    },
    Joel: {
        genericId: 29,
        names: { en: ['Joel', 'Jl', 'Joel', 'Joe', 'Jol'] },
    },
    Amos: {
        genericId: 30,
        names: { en: ['Amos', 'Am', 'Amos', 'Amo'] },
    },
    Obad: {
        genericId: 31,
        names: { en: ['Obadiah', 'Ob', 'Oba', 'Obd', 'Odbh'] },
    },
    Jonah: {
        genericId: 32,
        names: { en: ['Jonah', 'Jh', 'Jon', 'Jnh'] },
    },
    Mic: {
        genericId: 33,
        names: { en: ['Micah', 'Mi', 'Mic'] },
    },
    Nah: {
        genericId: 34,
        names: { en: ['Nahum', 'Na', 'Nah', 'Nah', 'Na', 'Nam'] },
    },
    Hab: {
        genericId: 35,
        names: { en: ['Habakkuk', 'Hb', 'Hab', 'Hk', 'Habk'] },
    },
    Zeph: {
        genericId: 36,
        names: { en: ['Zephaniah', 'Zp', 'Zep', 'Zeph'] },
    },
    Hag: {
        genericId: 37,
        names: { en: ['Haggai', 'Ha', 'Hag', 'Hagg'] },
    },
    Zech: {
        genericId: 38,
        names: { en: ['Zechariah', 'Zc', 'Zech', 'Zec'] },
    },
    Mal: {
        genericId: 39,
        names: { en: ['Malachi', 'Ml', 'Mal', 'Mlc'] },
    },

    /*
     New Testament
    */

    Matt: {
        genericId: 40,
        names: { en: ['Matthew', 'Mt', 'Matt', 'Mat'] },
    },
    Mark: {
        genericId: 41,
        names: { en: ['Mark', 'Mk', 'Mar', 'Mrk'] },
    },
    Luke: {
        genericId: 42,
        names: { en: ['Luke', 'Lk', 'Luk', 'Lu'] },
    },
    John: {
        genericId: 43,
        names: { en: ['John', 'Jn', 'Joh', 'Jo', 'Jhn'] },
    },
    Acts: {
        genericId: 44,
        names: { en: ['Acts', 'Ac', 'Act'] },
    },
    Rom: {
        genericId: 45,
        names: { en: ['Romans', 'Ro', 'Rom', 'Rmn', 'Rmns'] },
    },
    '1Cor': {
        genericId: 46,
        names: {
            en: [
                '1 Corinthians',
                '1Co',
                '1 Cor',
                '1Cor',
                'ICo',
                '1 Co',
                '1Co',
                'I Corinthians',
                'I Cor',
                'I Co',
            ],
        },
    },
    '2Cor': {
        genericId: 47,
        names: {
            en: [
                '2 Corinthians',
                '2Co',
                '2 Cor',
                '2Cor',
                'IICo',
                '2 Co',
                '2Co',
                'II Corinthians',
                'II Cor',
                'II Co',
            ],
        },
    },
    Gal: {
        genericId: 48,
        names: { en: ['Galatians', 'Ga', 'Gal', 'Gltns'] },
    },
    Eph: {
        genericId: 49,
        names: { en: ['Ephesians', 'Ep', 'Eph', 'Ephn'] },
    },
    Phil: {
        genericId: 50,
        names: { en: ['Philippians', 'Pp', 'Phi', 'Phil', 'Phi', 'Php'] },
    },
    Col: {
        genericId: 51,
        names: { en: ['Colossians', 'Co', 'Col', 'Colo', 'Cln', 'Clns'] },
    },
    '1Thess': {
        genericId: 52,
        names: {
            en: [
                '1 Thessalonians',
                '1Th',
                '1 Thess',
                '1Thess',
                'ITh',
                '1 Thes',
                '1Thes',
                '1 The',
                '1The',
                '1 Th',
                '1Th',
                'I Thessalonians',
                'I Thess',
                'I The',
                'I Th',
            ],
        },
    },
    '2Thess': {
        genericId: 53,
        names: {
            en: [
                '2 Thessalonians',
                '2Th',
                '2 Thess',
                '2 Thess',
                '2Thess',
                'IITh',
                '2 Thes',
                '2Thes',
                '2 The',
                '2The',
                '2 Th',
                '2Th',
                'II Thessalonians',
                'II Thess',
                'II The',
                'II Th',
            ],
        },
    },
    '1Tim': {
        genericId: 54,
        names: {
            en: [
                '1 Timothy',
                '1Ti',
                '1 Tim',
                '1Tim',
                '1 Ti',
                'ITi',
                '1Ti',
                'I Timothy',
                'I Tim',
                'I Ti',
            ],
        },
    },
    '2Tim': {
        genericId: 55,
        names: {
            en: [
                '2 Timothy',
                '2Ti',
                '2 Tim',
                '2 Tim',
                '2Tim',
                '2 Ti',
                'IITi',
                '2Ti',
                'II Timothy',
                'II Tim',
                'II Ti',
            ],
        },
    },
    Titus: {
        genericId: 56,
        names: { en: ['Titus', 'Ti', 'Tit', 'Tt', 'Ts'] },
    },
    Phlm: {
        genericId: 57,
        names: { en: ['Philemon', 'Pm', 'Phile', 'Phile', 'Philm', 'Pm', 'Phm'] },
    },
    Heb: {
        genericId: 58,
        names: { en: ['Hebrews', 'He', 'Heb', 'Hw'] },
    },
    Jas: {
        genericId: 59,
        names: { en: ['James', 'Jm', 'Jam', 'Jas', 'Ja'] },
    },
    '1Pet': {
        genericId: 60,
        names: {
            en: ['1 Peter', '1P', '1 Pet', '1Pet', 'IPe', '1P', 'I Peter', 'I Pet', 'I Pe', '1Pe'],
        },
    },
    '2Pet': {
        genericId: 61,
        names: {
            en: [
                '2 Peter',
                '2P',
                '2 Pet',
                '2Pet',
                '2Pe',
                'IIP',
                'II Peter',
                'II Pet',
                'II Pe',
                '2Pe',
            ],
        },
    },
    '1John': {
        genericId: 62,
        names: { en: ['1 John', '1J', '1 Jn', '1Jn', '1 Jo', 'IJo', 'I John', 'I Jo', 'I Jn'] },
    },
    '2John': {
        genericId: 63,
        names: { en: ['2 John', '2J', '2 Jn', '2Jn', '2 Jo', 'IIJo', 'II John', 'II Jo', 'II Jn'] },
    },
    '3John': {
        genericId: 64,
        names: {
            en: [
                '3 John',
                '3J',
                '3 Jn',
                '3 Jn',
                '3Jn',
                '3 Jo',
                'IIIJo',
                'III John',
                'III Jo',
                'III Jn',
            ],
        },
    },
    Jude: {
        genericId: 65,
        names: { en: ['Jude', 'Jude', 'Jude'] },
    },
    Rev: {
        genericId: 66,
        names: { en: ['Revelation', 'Re', 'Rev', 'Rvltn'] },
    },

    /*
     Apocrypha
    */

    Tob: {
        genericId: 70,
        names: { en: ['Tobit'] },
    },
    Jdt: {
        genericId: 71,
        names: { en: ['Judith'] },
    },
    AddEsth: {
        genericId: 72,
        names: { en: ['Additions to Esther'] },
    },
    Wis: {
        genericId: 73,
        names: { en: ['Wisdom', 'Wisdom of Solomon'] },
    },
    Sir: {
        genericId: 74,
        names: { en: ['Sirach', 'Ecclesiasticus'] },
    },
    Bar: {
        genericId: 75,
        names: { en: ['Baruch'] },
    },
    EpJer: {
        genericId: 76,
        names: { en: ['Letter of Jeremiah', 'Lje'] },
    },
    PrAzar: {
        genericId: 77,
        names: { en: ['Prayer of Azariah'] },
    },
    Sus: {
        genericId: 78,
        names: { en: ['Susanna'] },
    },
    Bel: {
        genericId: 79,
        names: { en: ['Bel and the Dragon'] },
    },
    '1Macc': {
        genericId: 80,
        names: { en: ['1 Maccabees'] },
    },
    '2Macc': {
        genericId: 81,
        names: { en: ['2 Maccabees'] },
    },
    '3Macc': {
        genericId: 82,
        names: { en: ['3 Maccabees'] },
    },
    '4Macc': {
        genericId: 83,
        names: { en: ['4 Maccabees'] },
    },
    PrMan: {
        genericId: 84,
        names: { en: ['Prayer of Manasseh', 'Song of the Three Children'] },
    },
    '1Esd': {
        genericId: 85,
        names: { en: ['1 Esdras'] },
    },
    '2Esd': {
        genericId: 86,
        names: { en: ['2 Esdras', '5 Ezra'] },
    },
    Ps151: {
        genericId: 87,
        names: { en: ['Psalm'] },
    },
};

/**
 * @description Default order of Old Testament books
 */
export const OT_BOOKS = [
    'Gen',
    'Exod',
    'Lev',
    'Num',
    'Deut',
    'Josh',
    'Judg',
    'Ruth',
    '1Sam',
    '2Sam',
    '1Kgs',
    '2Kgs',
    '1Chr',
    '2Chr',
    'Ezra',
    'Neh',
    'Esth',
    'Job',
    'Ps',
    'Prov',
    'Eccl',
    'Song',
    'Isa',
    'Jer',
    'Lam',
    'Ezek',
    'Dan',
    'Hos',
    'Joel',
    'Amos',
    'Obad',
    'Jonah',
    'Mic',
    'Nah',
    'Hab',
    'Zeph',
    'Hag',
    'Zech',
    'Mal',
];

/**
 * @description Default order of New Testament books
 */
export const NT_BOOKS = [
    'Matt',
    'Mark',
    'Luke',
    'John',
    'Acts',
    'Rom',
    '1Cor',
    '2Cor',
    'Gal',
    'Eph',
    'Phil',
    'Col',
    '1Thess',
    '2Thess',
    '1Tim',
    '2Tim',
    'Titus',
    'Phlm',
    'Heb',
    'Jas',
    '1Pet',
    '2Pet',
    '1John',
    '2John',
    '3John',
    'Jude',
    'Rev',
];

/**
 * @description Default order of Apocryphal books
 */
export const AP_BOOKS = [
    'Tob',
    'Jdt',
    'AddEsth',
    'Wis',
    'Sir',
    'Bar',
    'EpJer',
    'PrAzar',
    'Sus',
    'Bel',
    '1Macc',
    '2Macc',
    '3Macc',
    '4Macc',
    '1Esd',
    '2Esd',
    'Ps151',
];

// NRSV chapter and verse numbers
// prettier-ignore
export const NORMALIZED_VERSE_NUMS = [
    [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38,
        18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36,
        30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],

    [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25,
        26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29,
        31, 43, 38],

    [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37,
        27, 24, 33, 44, 23, 55, 46, 34],

    [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22,
        29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13],

    [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21,
        20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12],

    [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51,
        9, 45, 34, 16, 33],

    [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30,
        48, 25],

    [22, 23, 18, 22],

    [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24,
        42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13],

    [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43,
        26, 22, 51, 39, 25],

    [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21,
        43, 29, 53],

    [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37,
        21, 26, 20, 37, 20, 30],

    [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19,
        8, 30, 19, 32, 31, 31, 32, 34, 21, 30],

    [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11,
        37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23],

    [11, 70, 13, 24, 17, 22, 28, 36, 15, 44],

    [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31],

    [22, 23, 15, 17, 14, 14, 10, 17, 32, 3],

    [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29,
        29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41,
        30, 24, 34, 17],

    [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13,
        31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17,
        13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12,
        8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13,
        19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9,
        5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176,
        7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7,
        12, 15, 21, 10, 20, 14, 9, 6],

    [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29,
        30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31],

    [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14],

    [17, 17, 11, 16, 16, 13, 13, 14],

    [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6,
        17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8,
        31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21,
        14, 21, 22, 11, 12, 19, 12, 25, 24],

    [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15,
        18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21,
        28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34],

    [22, 22, 66, 22, 22],

    [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14,
        49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28,
        23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35],

    [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13],

    [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9],

    [20, 32, 21],

    [15, 16, 15, 13, 27, 14, 17, 14, 15],

    [21],

    [17, 10, 10, 11],

    [16, 13, 12, 13, 15, 16, 20],

    [15, 13, 19],

    [17, 20, 19],

    [18, 15, 20],

    [15, 23],

    [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21],

    [14, 17, 18, 6],

    [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30,
        34, 46, 46, 39, 51, 46, 75, 66, 20],

    [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20],

    [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48,
        47, 38, 71, 56, 53],

    [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42,
        31, 25],

    [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41,
        38, 40, 30, 35, 27, 27, 32, 44, 31],

    [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27],

    [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24],

    [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14],

    [24, 21, 29, 31, 26, 18],

    [23, 22, 21, 32, 33, 24],

    [30, 30, 21, 23],

    [29, 23, 25, 18],

    [10, 20, 13, 18, 28],

    [12, 17, 18],

    [20, 15, 16, 16, 25, 21],

    [18, 26, 17, 22],

    [16, 15, 15],

    [25],

    [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25],

    [27, 26, 18, 17, 20],

    [25, 25, 22, 19, 14],

    [21, 22, 18],

    [10, 29, 24, 21, 21],

    [13],

    [15],

    [25],

    [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21,
        15, 27, 21]
];

const sourceTypes = new Map([
    [0, 'AllBibles'],
    [10, 'English'],
    [11, 'English+Greek'],
    [12, 'English+Greek1'],
    [13, 'English+Greek2'],
    [14, 'English+Latin'],
    [15, 'English+Latin+Greek'],
    [16, 'English+Latin2'],
    [17, 'English+Hebrew'],
    [18, 'English+Hebrew+Greek'],
    [19, 'English+Hebrew+Latin'],
    [20, 'English+Hebrew+Latin+Greek'],
    [21, 'EngTitleSeparate'],
    [22, 'EngTitleMerged'],
    [23, 'EngTitleMerged+Hebrew'],
    [24, 'English2'],
    [25, 'English2+Greek2'],
    [26, 'English3'],
    [30, 'Hebrew'],
    [31, 'Hebrew+Greek'],
    [32, 'Hebrew+Latin'],
    [33, 'Hebrew+Latin+Greek'],
    [34, 'Hebrew2'],
    [40, 'Latin'],
    [41, 'LatinUndivided'],
    [42, 'Latin+Greek'],
    [43, 'Latin2-DRA'],
    [44, 'Latin2'],
    [45, 'Latin+Greek2'],
    [46, 'Latin+Hebrew'],
    [47, 'Latin+Bulgarian'],
    [50, 'Greek'],
    [51, 'GreekUndivided'],
    [52, 'Greek2'],
    [53, 'Greek2Undivided'],
    [54, 'GreekUndivided2'],
    [55, 'Greek2-NETS'],
    [56, 'GreekIntegrated'],
    [57, 'Greek3'],
    [58, 'GrkTitleMerged'],
    [59, 'GrkTitleSeparate'],
    [60, 'GrkTitleSeparate2'],
    [61, 'Greek+Latin'],
    [70, 'German'],
    [80, 'Slavonic'],
    [81, 'SpanishRV'],
    [82, 'Bangladeshi'],
    [83, 'FrenchNEG'],
    [84, 'Japanese'],
    [85, 'Bulgarian'],
    [86, 'Bulgarian2'],
    [87, 'BrentonMerged'],
    [88, 'Lingala'],
    [89, 'Italian'],
    [90, 'Arabic'],
]);

export const getBookGenericIdFromOsisId = (osisId: string, checkAlternatives = false) => {
    if (!BOOK_DATA[osisId]) {
        if (checkAlternatives) {
            const fallbackOsisId = getOsisIdFromBookString(osisId);
            if (fallbackOsisId) return BOOK_DATA[fallbackOsisId].genericId;
        }
        throw new Error(`invalid osis id '${osisId}'`);
    }
    return BOOK_DATA[osisId].genericId;
};

export const getNormalizedChapterCountForOsisId = (osisId: string) =>
    NORMALIZED_VERSE_NUMS[getBookGenericIdFromOsisId(osisId) - 1].length;

export const getNormalizedVerseCount = (osisId: string, chapterNum: number) =>
    NORMALIZED_VERSE_NUMS[getBookGenericIdFromOsisId(osisId) - 1][chapterNum - 1];

export const getOsisIdFromBookGenericId = (bookGenericId: number) => {
    if (
        bookGenericId < 1 ||
        bookGenericId > 87 ||
        bookGenericId === 67 ||
        bookGenericId === 68 ||
        bookGenericId === 69
    )
        throw new Error(`invalid generic book id ${bookGenericId}`);

    let osisId: string;
    if (bookGenericId <= 39) osisId = OT_BOOKS[bookGenericId - 1];
    else if (bookGenericId <= 66) osisId = NT_BOOKS[bookGenericId - OT_BOOKS.length - 1];
    else osisId = AP_BOOKS[bookGenericId - 70];

    // safeguard in case this file becomes inconsistent / corrupted
    if (bookGenericId !== getBookGenericIdFromOsisId(osisId))
        throw new Error(`standardV11n data got corrupted`);

    return osisId;
};

export const getOsisIdFromBookString = (bookString: string, language = 'en') => {
    if (BOOK_DATA[bookString]) return bookString;
    else {
        for (const _osisId of Object.keys(BOOK_DATA)) {
            if (BOOK_DATA[_osisId].names[language].includes(bookString)) return _osisId;
        }
    }
    return false;
};

export const getSourceTypeFromId = (sourceTypeId: number) => sourceTypes.get(sourceTypeId);

export const getSourceTypeId = (sourceType: string) => {
    for (const entry of sourceTypes) if (entry[1] === sourceType) return entry[0];
    return undefined;
};

export const isTestMatching = (test: string, context: BibleBookPlaintext) => {
    if (!test) return true;

    type TestReference = {
        chapterNumber: number;
        verseNumber: number;
        subverseNumber?: number;
        factor: number;
    };
    const tests = test.split(' & ');

    for (const testString of tests) {
        // if we have a failing test we can always return false since tests are always "match-all"

        let testParts = testString.match(/(.*)([=<>])(.*)/);
        if (!testParts) {
            throw new Error(`v11n rule test parse error: ${testString}`);
        }

        const refBaseFactorParts = testParts[1].split('*');
        const refBaseReferenceParts = refBaseFactorParts[0].split('.');
        const refBaseNumbers = refBaseReferenceParts[1].split(':');
        const refBaseAddition = refBaseReferenceParts[2]?.split('+');

        const refBase: TestReference = {
            chapterNumber: +refBaseNumbers[0],
            verseNumber: +refBaseNumbers[1],
            subverseNumber: refBaseAddition?.[0] ? +refBaseAddition[0] : 1,
            factor: refBaseFactorParts[1] ? +refBaseFactorParts[1] : 1,
        };
        const contextChapter = context.get(refBase.chapterNumber);

        if (testParts[2] === '=') {
            const refTest = <'Last' | 'Exist' | 'NotExist'>testParts[3];

            if (refTest === 'Last') {
                if (
                    !contextChapter ||
                    !contextChapter.has(refBase.verseNumber) ||
                    contextChapter.has(refBase.verseNumber + 1)
                )
                    return false;
            } else if (refTest === 'Exist') {
                if (
                    !contextChapter ||
                    !contextChapter.has(refBase.verseNumber) ||
                    // RADAR: we have a problem since in BibleEngine subverse 1 always exists (and subverse zero if psalm title exists) however in the
                    //        context of the rules subverses only exist if explicitly created. We try to approximate a check by handling the three cases
                    //        0, 1 and >1 differently
                    (refBase.subverseNumber === 0 &&
                        !contextChapter.get(refBase.verseNumber)![0]) ||
                    // we assume a check for `.1=Exist` wants to know if subverses are created at all (which only make sense if there are more than one)
                    //  => this case is handled above already
                    // we assume a check for `.2=Exist` wants to test for a certain number of subverses to at least exists
                    (refBase.subverseNumber &&
                        refBase.subverseNumber > 1 &&
                        contextChapter.get(refBase.verseNumber)!.filter(Boolean).length <
                            refBase.subverseNumber)
                )
                    return false;
            } else if (refTest === 'NotExist') {
                if (
                    contextChapter &&
                    contextChapter.has(refBase.verseNumber) &&
                    (typeof refBase.subverseNumber === 'undefined' ||
                        refBase.subverseNumber === 1 ||
                        // see comment at `Exist`
                        (refBase.subverseNumber === 0 &&
                            contextChapter.get(refBase.verseNumber)![0]) ||
                        (refBase.subverseNumber > 1 &&
                            contextChapter.get(refBase.verseNumber)!.filter(Boolean).length >=
                                refBase.subverseNumber))
                )
                    return false;
            }
        } else {
            const refCompareFactorParts = testParts[3].split('*');
            const refCompareReferenceParts = refCompareFactorParts[0].split('.');
            const refCompareNumbers = refCompareReferenceParts[1].split(':');
            const refCompare: TestReference = {
                chapterNumber: +refCompareNumbers[0],
                verseNumber: +refCompareNumbers[1],
                subverseNumber: refCompareReferenceParts[2] ? +refCompareReferenceParts[2] : 1,
                factor: refCompareFactorParts[1] ? +refCompareFactorParts[1] : 1,
            };
            const contextCompareChapter = context.get(refCompare.chapterNumber);

            if (!contextChapter || !contextCompareChapter) return false;

            const baseVerse = contextChapter.get(refBase.verseNumber);
            const compareVerse = contextCompareChapter.get(refCompare.verseNumber);

            if (!baseVerse || !compareVerse) return false;

            // RADAR: currently the only rules that use an addition add together the psalm title with verse 1.
            //        since BibleEngine puts the title in 1.0, we just join the whole verse in that case for simplicity.
            const baseText =
                refBase.subverseNumber && !refBaseAddition?.[1]
                    ? baseVerse[refBase.subverseNumber]
                    : baseVerse.join(' ');
            const compareText = refCompare.subverseNumber
                ? compareVerse[refCompare.subverseNumber]
                : compareVerse.join(' ');

            const baseLength = baseText.length * refBase.factor;
            const compareLength = compareText.length * refCompare.factor;
            if (testParts[2] === '<') {
                if (baseLength > compareLength) return false;
            } else if (testParts[2] === '>') {
                if (baseLength < compareLength) return false;
            }
        }
    }

    return true;
};
