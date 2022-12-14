
    import { apiRequest, Clientify, ThenArg, 
                FirstArgument, SecondArgument, ThirdArgument, FourthArgument, FifthArgument
            } from './helpers';
    import { BibleController } from '@bible-engine/server';

    export class BibleApi implements Clientify<BibleController> {
        constructor(private apiBaseUrl: string) {}    
    
        getVersions(
        ) {
            let path = '/bible/versions';
        
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getVersions']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getVersion(
            params: {
                versionUid: FirstArgument<BibleController['getVersion']>;
            },
        ) {
            let path = '/bible/versions/:versionUid';
        
            path = path.replace(':versionUid', params.versionUid+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getVersion']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getBooksForVersion(
            params: {
                versionUid: FirstArgument<BibleController['getBooksForVersion']>;
            },
        ) {
            let path = '/bible/versions/:versionUid/books';
        
            path = path.replace(':versionUid', params.versionUid+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getBooksForVersion']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getBookSections(
            params: {
                versionUid: FirstArgument<BibleController['getBookSections']>;
                osisId: SecondArgument<BibleController['getBookSections']>;
            },
        ) {
            let path = '/bible/sections/:versionUid/:osisId';
        
            path = path.replace(':versionUid', params.versionUid+'');
            path = path.replace(':osisId', params.osisId+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getBookSections']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getChapter(
            params: {
                versionUid: FirstArgument<BibleController['getChapter']>;
                osisId: SecondArgument<BibleController['getChapter']>;
                chapterNr: ThirdArgument<BibleController['getChapter']>;
            },
        ) {
            let path = '/bible/ref/:versionUid/:osisId/:chapterNr';
        
            path = path.replace(':versionUid', params.versionUid+'');
            path = path.replace(':osisId', params.osisId+'');
            path = path.replace(':chapterNr', params.chapterNr+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getChapter']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getVerses(
            params: {
                versionUid: FirstArgument<BibleController['getVerses']>;
                osisId: SecondArgument<BibleController['getVerses']>;
                chapterNr: ThirdArgument<BibleController['getVerses']>;
                verseNr: FourthArgument<BibleController['getVerses']>;
                chapterEnd?: FifthArgument<BibleController['getVerses']>;
                verseEnd?: any;
            },
        ) {
            let path = '/bible/ref/:versionUid/:osisId/:chapterNr/:verseNr';
        
            path = path.replace(':versionUid', params.versionUid+'');
            path = path.replace(':osisId', params.osisId+'');
            path = path.replace(':chapterNr', params.chapterNr+'');
            path = path.replace(':verseNr', params.verseNr+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getVerses']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
                queryParams: {
                    chapterEnd: params.chapterEnd,
                    verseEnd: params.verseEnd,
                }
            });
        }
        
        getReferenceRange(
            data?: FirstArgument<BibleController['getReferenceRange']>,
        ) {
            let path = '/bible/ref';
        
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getReferenceRange']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'POST',
                data: data,
            });
        }
        
        getDefinitions(
            params: {
                strongNum: FirstArgument<BibleController['getDefinitions']>;
            },
        ) {
            let path = '/bible/definitions/:strongNum';
        
            path = path.replace(':strongNum', params.strongNum+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getDefinitions']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        getDefinition(
            params: {
                strongNum: FirstArgument<BibleController['getDefinition']>;
                dictionaryId: SecondArgument<BibleController['getDefinition']>;
            },
        ) {
            let path = '/bible/definitions/:strongNum/:dictionaryId';
        
            path = path.replace(':strongNum', params.strongNum+'');
            path = path.replace(':dictionaryId', params.dictionaryId+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['getDefinition']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
            });
        }
        
        search(
            params: {
                versionUid: FirstArgument<BibleController['search']>;
                query: SecondArgument<BibleController['search']>;
                queryMode?: ThirdArgument<BibleController['search']>;
                sortMode?: FourthArgument<BibleController['search']>;
                page?: FifthArgument<BibleController['search']>;
                count?: any;
                rangeStart?: any;
                rangeEnd?: any;
            },
        ) {
            let path = '/bible/search/:versionUid/:query';
        
            path = path.replace(':versionUid', params.versionUid+'');
            path = path.replace(':query', params.query+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['search']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'GET',
                queryParams: {
                    queryMode: params.queryMode,
                    sortMode: params.sortMode,
                    page: params.page,
                    count: params.count,
                    rangeStart: params.rangeStart,
                    rangeEnd: params.rangeEnd,
                }
            });
        }
        
        syncVersions(
            params: {
                lang: FirstArgument<BibleController['syncVersions']>;
            },
            data?: SecondArgument<BibleController['syncVersions']>,
        ) {
            let path = '/bible/versions/:lang';
        
            path = path.replace(':lang', params.lang+'');
            
            return apiRequest<
                ThenArg<ReturnType<BibleController['syncVersions']>>
            >({
                url: this.apiBaseUrl + path,
                method: 'POST',
                data: data,
            });
        }
        
    }