# sqlBible

## Usage

```typescript
// initialize SqlBible
import SqlBible from 'sql-bible';

const sqlBible = new SqlBible({
    type: 'sqlite',
    database: './bible.db'
});

/**
 * INPUT
 */

// if you haven't created a version yet, do
const esvVersionId = await sqlBible.addVersion(
    new BibleVersion({
        version: 'ESV',
        description: 'English Standard Bible',
        language: 'en-US'
    })
);

// you add one bible book at a time. first we compile the content of the book

// ideally, adding verses should be done paragraph by paragraph:
// a paragraph is a list of phrases:
const phrases: BiblePhrase[] = [];


// we add cross references directly to a phrase
// (we use a sqlBible-method here since normalized references need to be created)
const cRef = await sqlBible.createCrossReference({
    versionId: esvVersionId,
    bookOsisId: 'Gen',
    versionChapterNum: 1
});

// .. notes likewise
const note1 = new BibleNote();
note1.setPhrases([
    { text: 'this is' },
    { text: 'very', italic: true },
    { text: 'important', crossReferences: [cRef] }
]);

const phrase1 = new BiblePhrase({
    versionId: esvVersionId,
    bookOsisId: 'Gen',
    versionChapterNum: 1,
    versionVerseNum: 1,
    text: 'In the beginning',
    strong: 'G1230',
    notes: [note1]
});

const phrase2 = new BiblePhrase({
    versionId: esvVersionId,
    bookOsisId: 'Gen',
    versionChapterNum: 1,
    versionVerseNum: 1,
    text: 'god',
    bold: true,
    strong: 'G5630',
    crossReferences: [cRef]
});

phrases.push(phrase1, phrase2);

const phrases1 = phrases2 = phrases3 = phrases;

const bookContent = {
    type: 'sections';
    sections: [
        {
            level: 1,
            title: 'Creation',
            content: {
                type: 'sections',
                sections: [
                    {
                        level: 0,
                        content: {
                            type: 'phrases',
                            phrases: phrases1
                        }
                    }, {
                        level: 0,
                        content: {
                            type: 'phrases',
                            phrases: phrases2
                        }
                    }
                ]
            }
        }, {
            level: 1,
            title: 'Fall',
            content: {
                type: 'sections',
                sections: [
                    {
                        level: 0,
                        content: {
                            type: 'phrases',
                            phrases: phrases3
                        }
                    }
                ]
            }
        }
    ]
}

// ... and then feed it to sqlBible
const bookGenesis = await sqlBible.addBook(
    new BibleBook({
        versionId: esvVersionId,
        number: 1, // order of book in version
        osisId: 'Gen',
        title: 'Genesis',
        type: 'ot',
        content
    })
);

// after you added all books of a versions, you need to run
sqlBible.finalizeVersion(esvVersionId);

/**
 * OUTPUT
 */

// on a basic output level you can get a list of phrases like this:
const phrases = await sqlBible.getPhrases({
    versionId: 1,
    bookOsisId: 'Gen',
    versionChapterNum: 1,
    versionVerseNum: 3
});

// more output methods and features coming soon
```
