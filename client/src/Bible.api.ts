import {
    apiRequest,
    Clientify,
    ThenArg,
    FirstArgument,
    SecondArgument,
    ThirdArgument,
    FourthArgument,
    FifthArgument
} from './helpers';
import { BibleController } from '@bible-engine/server';

export class BibleApi implements Clientify<BibleController> {
    constructor(private apiBaseUrl: string) {}

    getVersions() {
        let path = '/bible/versions';

        return apiRequest<ThenArg<ReturnType<BibleController['getVersions']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getVersion(params: { versionUid: FirstArgument<BibleController['getVersion']> }) {
        let path = '/bible/versions/:versionUid';

        path = path.replace(':versionUid', params.versionUid + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getVersion']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getBooksForVersion(params: {
        versionUid: FirstArgument<BibleController['getBooksForVersion']>;
    }) {
        let path = '/bible/versions/:versionUid/books';

        path = path.replace(':versionUid', params.versionUid + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getBooksForVersion']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getChapter(params: {
        versionUid: FirstArgument<BibleController['getChapter']>;
        osisId: SecondArgument<BibleController['getChapter']>;
        chapterNr: ThirdArgument<BibleController['getChapter']>;
    }) {
        let path = '/bible/ref/:versionUid/:osisId/:chapterNr';

        path = path.replace(':versionUid', params.versionUid + '');
        path = path.replace(':osisId', params.osisId + '');
        path = path.replace(':chapterNr', params.chapterNr + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getChapter']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getVerse(params: {
        versionUid: FirstArgument<BibleController['getVerse']>;
        osisId: SecondArgument<BibleController['getVerse']>;
        chapterNr: ThirdArgument<BibleController['getVerse']>;
        verseNr: FourthArgument<BibleController['getVerse']>;
    }) {
        let path = '/bible/ref/:versionUid/:osisId/:chapterNr/:verseNr';

        path = path.replace(':versionUid', params.versionUid + '');
        path = path.replace(':osisId', params.osisId + '');
        path = path.replace(':chapterNr', params.chapterNr + '');
        path = path.replace(':verseNr', params.verseNr + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getVerse']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getVerses(params: {
        versionUid: FirstArgument<BibleController['getVerses']>;
        osisId: SecondArgument<BibleController['getVerses']>;
        chapterNr: ThirdArgument<BibleController['getVerses']>;
        verseNr: FourthArgument<BibleController['getVerses']>;
        verseEndNr: FifthArgument<BibleController['getVerses']>;
    }) {
        let path = '/bible/ref/:versionUid/:osisId/:chapterNr/:verseNr-:verseEndNr';

        path = path.replace(':versionUid', params.versionUid + '');
        path = path.replace(':osisId', params.osisId + '');
        path = path.replace(':chapterNr', params.chapterNr + '');
        path = path.replace(':verseNr', params.verseNr + '');
        path = path.replace(':verseEndNr', params.verseEndNr + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getVerses']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getReferenceRange(data?: FirstArgument<BibleController['getReferenceRange']>) {
        let path = '/bible/ref';

        return apiRequest<ThenArg<ReturnType<BibleController['getReferenceRange']>>>({
            url: this.apiBaseUrl + path,
            method: 'POST',
            data: data
        });
    }

    getDefinitions(params: { strongNum: FirstArgument<BibleController['getDefinitions']> }) {
        let path = '/bible/definitions/:strongNum';

        path = path.replace(':strongNum', params.strongNum + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getDefinitions']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }

    getDefinition(params: {
        strongNum: FirstArgument<BibleController['getDefinition']>;
        dictionaryId: SecondArgument<BibleController['getDefinition']>;
    }) {
        let path = '/bible/definitions/:strongNum/:dictionaryId';

        path = path.replace(':strongNum', params.strongNum + '');
        path = path.replace(':dictionaryId', params.dictionaryId + '');

        return apiRequest<ThenArg<ReturnType<BibleController['getDefinition']>>>({
            url: this.apiBaseUrl + path,
            method: 'GET'
        });
    }
}
