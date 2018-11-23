/**
 * @description OSIS book ID with chapter/verse statistics and English names
 */
export const BOOK_DATA: {
    [key: string]: { genericId: number; names: { [key: string]: string[] } };
} = {
    /*
	 Old Testament
	*/
    Gen: {
        genericId: 1,
        names: { eng: ['Genesis', 'Ge', 'Gen'] }
    },
    Exod: {
        genericId: 2,
        names: { eng: ['Exodus', 'Ex', 'Exo'] }
    },
    Lev: {
        genericId: 3,
        names: { eng: ['Leviticus', 'Le', 'Lev'] }
    },
    Num: {
        genericId: 4,
        names: { eng: ['Numbers', 'Nu', 'Num'] }
    },
    Deut: {
        genericId: 5,
        names: { eng: ['Deuteronomy', 'Dt', 'Deut', 'Deu', 'De'] }
    },
    Josh: {
        genericId: 6,
        names: { eng: ['Joshua', 'Js', 'Jos', 'Jos', 'Josh'] }
    },
    Judg: {
        genericId: 7,
        names: { eng: ['Judges', 'Jg', 'Jdg', 'Jdgs'] }
    },
    Ruth: {
        genericId: 8,
        names: { eng: ['Ruth', 'Ru', 'Rut'] }
    },
    '1Sam': {
        genericId: 9,
        names: {
            eng: ['1 Samuel', '1S', '1 Sam', '1Sam', '1 Sa', '1Sa', 'I Samuel', 'I Sam', 'I Sa']
        }
    },
    '2Sam': {
        genericId: 10,
        names: {
            eng: [
                '2 Samuel',
                '2S',
                '2 Sam',
                '2Sam',
                '2 Sa',
                '2Sa',
                'II Samuel',
                'II Sam',
                'II Sa',
                'IIS'
            ]
        }
    },
    '1Kgs': {
        genericId: 11,
        names: {
            eng: ['1 Kings', '1K', '1 Kin', '1Kin', '1 Ki', 'IK', '1Ki', 'I Kings', 'I Kin', 'I Ki']
        }
    },
    '2Kgs': {
        genericId: 12,
        names: {
            eng: [
                '2 Kings',
                '2K',
                '2 Kin',
                '2Kin',
                '2 Ki',
                'IIK',
                '2Ki',
                'II Kings',
                'II Kin',
                'II Ki'
            ]
        }
    },
    '1Chr': {
        genericId: 13,
        names: {
            eng: [
                '1 Chronicles',
                '1Ch',
                '1 Chr',
                '1Chr',
                '1 Ch',
                'ICh',
                'I Chronicles',
                'I Chr',
                'I Ch'
            ]
        }
    },
    '2Chr': {
        genericId: 14,
        names: {
            eng: [
                '2 Chronicles',
                '2Ch',
                '2 Chr',
                '2 Chr',
                '2Chr',
                '2 Ch',
                'IICh',
                'II Chronicles',
                'II Chr',
                'II Ch'
            ]
        }
    },
    Ezra: {
        genericId: 15,
        names: { eng: ['Ezra', 'Ezr'] }
    },
    Neh: {
        genericId: 16,
        names: { eng: ['Nehemiah', 'Ne', 'Neh', 'Neh', 'Ne'] }
    },
    Esth: {
        genericId: 17,
        names: { eng: ['Esther', 'Es', 'Est', 'Esth'] }
    },
    Job: {
        genericId: 18,
        names: { eng: ['Job', 'Jb', 'Job'] }
    },
    Ps: {
        genericId: 19,
        names: { eng: ['Psalm', 'Ps', 'Psa'] }
    },
    Prov: {
        genericId: 20,
        names: { eng: ['Proverbs', 'Pr', 'Prov', 'Pro'] }
    },
    Eccl: {
        genericId: 21,
        names: { eng: ['Ecclesiastes', 'Ec', 'Ecc', 'Qohelet'] }
    },
    Song: {
        genericId: 22,
        names: {
            eng: [
                'Song of Songs',
                'So',
                'Sos',
                'Song of Solomon',
                'SOS',
                'SongOfSongs',
                'SongofSolomon',
                'Canticle of Canticles'
            ]
        }
    },
    Isa: {
        genericId: 23,
        names: { eng: ['Isaiah', 'Is', 'Isa'] }
    },
    Jer: {
        genericId: 24,
        names: { eng: ['Jeremiah', 'Je', 'Jer'] }
    },
    Lam: {
        genericId: 25,
        names: { eng: ['Lamentations', 'La', 'Lam', 'Lament'] }
    },
    Ezek: {
        genericId: 26,
        names: { eng: ['Ezekiel', 'Ek', 'Ezek', 'Eze'] }
    },
    Dan: {
        genericId: 27,
        names: { eng: ['Daniel', 'Da', 'Dan', 'Dl', 'Dnl'] }
    },
    Hos: {
        genericId: 28,
        names: { eng: ['Hosea', 'Ho', 'Hos'] }
    },
    Joel: {
        genericId: 29,
        names: { eng: ['Joel', 'Jl', 'Joel', 'Joe'] }
    },
    Amos: {
        genericId: 30,
        names: { eng: ['Amos', 'Am', 'Amos', 'Amo'] }
    },
    Obad: {
        genericId: 31,
        names: { eng: ['Obadiah', 'Ob', 'Oba', 'Obd', 'Odbh'] }
    },
    Jonah: {
        genericId: 32,
        names: { eng: ['Jonah', 'Jh', 'Jon', 'Jnh'] }
    },
    Mic: {
        genericId: 33,
        names: { eng: ['Micah', 'Mi', 'Mic'] }
    },
    Nah: {
        genericId: 34,
        names: { eng: ['Nahum', 'Na', 'Nah', 'Nah', 'Na'] }
    },
    Hab: {
        genericId: 35,
        names: { eng: ['Habakkuk', 'Hb', 'Hab', 'Hk', 'Habk'] }
    },
    Zeph: {
        genericId: 36,
        names: { eng: ['Zephaniah', 'Zp', 'Zep', 'Zeph'] }
    },
    Hag: {
        genericId: 37,
        names: { eng: ['Haggai', 'Ha', 'Hag', 'Hagg'] }
    },
    Zech: {
        genericId: 38,
        names: { eng: ['Zechariah', 'Zc', 'Zech', 'Zec'] }
    },
    Mal: {
        genericId: 39,
        names: { eng: ['Malachi', 'Ml', 'Mal', 'Mlc'] }
    },

    /*
	 New Testament
	*/

    Matt: {
        genericId: 40,
        names: { eng: ['Matthew', 'Mt', 'Matt', 'Mat'] }
    },
    Mark: {
        genericId: 41,
        names: { eng: ['Mark', 'Mk', 'Mar', 'Mrk'] }
    },
    Luke: {
        genericId: 42,
        names: { eng: ['Luke', 'Lk', 'Luk', 'Lu'] }
    },
    John: {
        genericId: 43,
        names: { eng: ['John', 'Jn', 'Joh', 'Jo'] }
    },
    Acts: {
        genericId: 44,
        names: { eng: ['Acts', 'Ac', 'Act'] }
    },
    Rom: {
        genericId: 45,
        names: { eng: ['Romans', 'Ro', 'Rom', 'Rmn', 'Rmns'] }
    },
    '1Cor': {
        genericId: 46,
        names: {
            eng: [
                '1 Corinthians',
                '1Co',
                '1 Cor',
                '1Cor',
                'ICo',
                '1 Co',
                '1Co',
                'I Corinthians',
                'I Cor',
                'I Co'
            ]
        }
    },
    '2Cor': {
        genericId: 47,
        names: {
            eng: [
                '2 Corinthians',
                '2Co',
                '2 Cor',
                '2Cor',
                'IICo',
                '2 Co',
                '2Co',
                'II Corinthians',
                'II Cor',
                'II Co'
            ]
        }
    },
    Gal: {
        genericId: 48,
        names: { eng: ['Galatians', 'Ga', 'Gal', 'Gltns'] }
    },
    Eph: {
        genericId: 49,
        names: { eng: ['Ephesians', 'Ep', 'Eph', 'Ephn'] }
    },
    Phil: {
        genericId: 50,
        names: { eng: ['Philippians', 'Pp', 'Phi', 'Phil', 'Phi'] }
    },
    Col: {
        genericId: 51,
        names: { eng: ['Colossians', 'Co', 'Col', 'Colo', 'Cln', 'Clns'] }
    },
    '1Thess': {
        genericId: 52,
        names: {
            eng: [
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
                'I Th'
            ]
        }
    },
    '2Thess': {
        genericId: 53,
        names: {
            eng: [
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
                'II Th'
            ]
        }
    },
    '1Tim': {
        genericId: 54,
        names: {
            eng: [
                '1 Timothy',
                '1Ti',
                '1 Tim',
                '1Tim',
                '1 Ti',
                'ITi',
                '1Ti',
                'I Timothy',
                'I Tim',
                'I Ti'
            ]
        }
    },
    '2Tim': {
        genericId: 55,
        names: {
            eng: [
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
                'II Ti'
            ]
        }
    },
    Titus: {
        genericId: 56,
        names: { eng: ['Titus', 'Ti', 'Tit', 'Tt', 'Ts'] }
    },
    Phlm: {
        genericId: 57,
        names: { eng: ['Philemon', 'Pm', 'Phile', 'Phile', 'Philm', 'Pm'] }
    },
    Heb: {
        genericId: 58,
        names: { eng: ['Hebrews', 'He', 'Heb', 'Hw'] }
    },
    Jas: {
        genericId: 59,
        names: { eng: ['James', 'Jm', 'Jam', 'Jas', 'Ja'] }
    },
    '1Pet': {
        genericId: 60,
        names: { eng: ['1 Peter', '1P', '1 Pet', '1Pet', 'IPe', '1P', 'I Peter', 'I Pet', 'I Pe'] }
    },
    '2Pet': {
        genericId: 61,
        names: {
            eng: ['2 Peter', '2P', '2 Pet', '2Pet', '2Pe', 'IIP', 'II Peter', 'II Pet', 'II Pe']
        }
    },
    '1John': {
        genericId: 62,
        names: { eng: ['1 John', '1J', '1 Jn', '1Jn', '1 Jo', 'IJo', 'I John', 'I Jo', 'I Jn'] }
    },
    '2John': {
        genericId: 63,
        names: { eng: ['2 John', '2J', '2 Jn', '2Jn', '2 Jo', 'IIJo', 'II John', 'II Jo', 'II Jn'] }
    },
    '3John': {
        genericId: 64,
        names: {
            eng: [
                '3 John',
                '3J',
                '3 Jn',
                '3 Jn',
                '3Jn',
                '3 Jo',
                'IIIJo',
                'III John',
                'III Jo',
                'III Jn'
            ]
        }
    },
    Jude: {
        genericId: 65,
        names: { eng: ['Jude', 'Jude', 'Jude'] }
    },
    Rev: {
        genericId: 66,
        names: { eng: ['Revelation', 'Re', 'Rev', 'Rvltn'] }
    },

    /*
	 Apocrypha
	*/

    Tob: {
        genericId: 70,
        names: { eng: ['Tobit'] }
    },
    Jdt: {
        genericId: 71,
        names: { eng: ['Judith'] }
    },
    AddEsth: {
        genericId: 72,
        names: { eng: ['Additions to Esther'] }
    },
    Wis: {
        genericId: 73,
        names: { eng: ['Wisdom', 'Wisdom of Solomon'] }
    },
    Sir: {
        genericId: 74,
        names: { eng: ['Sirach', 'Ecclesiasticus'] }
    },
    Bar: {
        genericId: 75,
        names: { eng: ['Baruch'] }
    },
    EpJer: {
        genericId: 76,
        names: { eng: ['Letter of Jeremiah'] }
    },
    PrAzar: {
        genericId: 77,
        names: { eng: ['Prayer of Azariah'] }
    },
    Sus: {
        genericId: 78,
        names: { eng: ['Susanna'] }
    },
    Bel: {
        genericId: 79,
        names: { eng: ['Bel and the Dragon'] }
    },
    '1Macc': {
        genericId: 80,
        names: { eng: ['1 Maccabees'] }
    },
    '2Macc': {
        genericId: 81,
        names: { eng: ['2 Maccabees'] }
    },
    '3Macc': {
        genericId: 82,
        names: { eng: ['3 Maccabees'] }
    },
    '4Macc': {
        genericId: 83,
        names: { eng: ['4 Maccabees'] }
    },
    PrMan: {
        genericId: 84,
        names: { eng: ['Prayer of Manasseh', 'Song of the Three Children'] }
    },
    '1Esd': {
        genericId: 85,
        names: { eng: ['1 Esdras'] }
    },
    '2Esd': {
        genericId: 86,
        names: { eng: ['2 Esdras', '5 Ezra'] }
    },
    Ps151: {
        genericId: 87,
        names: { eng: ['Psalm'] }
    }
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
    'Mal'
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
    'Rev'
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
    'Ps151'
];

/**
 * @description Default order of bible with OT + NT
 */
export const DEFAULT_BIBLE = OT_BOOKS.concat(NT_BOOKS);

/**
 * @description Default order of Bible's with Apocryphal books
 */
export const APOCRYPHAL_BIBLE = OT_BOOKS.concat(AP_BOOKS, NT_BOOKS);

let bookGenericId2Osis: string[] = [];
for (const osisId of APOCRYPHAL_BIBLE) {
    bookGenericId2Osis[BOOK_DATA[osisId].genericId] = osisId;
}

export const getBookGenericIdFromOsisId = (osisId: string) => {
    if (!BOOK_DATA[osisId]) throw new Error(`invalid osis id '${osisId}'`);
    return BOOK_DATA[osisId].genericId;
};

export const getOsisIdFromBookGenericId = (bookGenericId: number) => {
    if (!bookGenericId2Osis[bookGenericId])
        throw new Error(`invalid generic book id ${bookGenericId}`);
    return bookGenericId2Osis[bookGenericId];
};
