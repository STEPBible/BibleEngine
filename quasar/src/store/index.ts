import { store } from 'quasar/wrappers';
import Vuex from 'vuex';
import { BibleEngineClient } from '@bible-engine/client';
import { IBibleBook, IBibleContent } from '@bible-engine/core';
import { SQLite } from './../models/SQLite';
import StrongsNumber from 'src/models/StrongsNumber';
import StrongsDefinition from 'src/models/StrongsDefinition';

export interface StoreInterface {
  books: IBibleBook[];
  book: {
    title: string,
    osisId: string
  },
  chapterContent?: IBibleContent,
  client?: BibleEngineClient
  fontScale: number,
  strongsDefinitions: any,
  strongsModal: boolean,
  versionChapterNum: number,
  versionUid: string
}

const SET_BOOKS = 'SET_BOOKS';
const SET_CHAPTER = 'SET_CHAPTER';
const SET_FONT_SCALE = 'SET_FONT_SCALE';
const SET_STRONGS = 'SET_STRONGS';
const SET_STRONGS_MODAL = 'SET_STRONGS_MODAL';
const SET_CLIENT = 'SET_CLIENT'

const BIBLE_DATABASE_NAME = 'bibles_v1.db';

export default store(function ({ Vue }) {
  Vue.use(Vuex);

  const Store = new Vuex.Store<StoreInterface>({
    state: {
      books: [],
      book: {
        title: 'Genesis',
        osisId: 'Gen'
      },
      chapterContent: undefined,
      client: undefined,
      fontScale: 1,
      strongsDefinitions: null,
      strongsModal: false,
      versionChapterNum: 1,
      versionUid: 'ESV'
    },
    getters: {
      fontScaleStyle: (state) => (
        `font-size: ${state.fontScale}rem`
      )
    },
    mutations: {
      [SET_CLIENT](state) {
        const bibleEngineOptions =
          SQLite.isAvailable() ? {
            type: 'cordova',
            location: 'default',
            database: BIBLE_DATABASE_NAME,
            synchronize: false,
          } : undefined
        state.client = new BibleEngineClient({
          bibleEngineOptions,
          apiBaseUrl: process.env.REMOTE_BIBLE_ENGINE_URL
        })
      },
      [SET_BOOKS](state, books) {
        state.books = books;
      },
      [SET_CHAPTER](state, { book, versionChapterNum, chapterContent }) {
        state.book = book;
        state.versionChapterNum = versionChapterNum;
        state.chapterContent = chapterContent;
      },
      [SET_FONT_SCALE](state, fontScale) {
        state.fontScale = fontScale
      },
      [SET_STRONGS](state, { definitions }) {
        state.strongsDefinitions = definitions;
      },
      [SET_STRONGS_MODAL](state, strongsModal) {
        state.strongsModal = strongsModal;
      }
    },
    actions: {
      async loadDatabase({ commit, dispatch }, { book, chapter, verse }) {
        if (SQLite.isAvailable()) {
          try {
            await SQLite.copy(BIBLE_DATABASE_NAME);
          } catch (error) {
            console.error('Failed to copy sqlite db: ', error);
          }
        }
        commit(SET_CLIENT)
        await dispatch('getChapter', {
          book: { osisId: book },
          versionChapterNum: chapter,
        });
        await dispatch('getBooks')
        const verseId = `${book}-${chapter}:${verse}`;
        const element = document.getElementById(verseId);
        element?.scrollIntoView();
      },
      decreaseFontSize({ commit, state }) {
        const SMALLEST_FONT_SCALE = 0.5
        if (state.fontScale < SMALLEST_FONT_SCALE) return
        commit(SET_FONT_SCALE, state.fontScale - 0.1)
      },
      increaseFontSize({ commit, state }) {
        const LARGEST_FONT_SCALE = 2.2
        if (state.fontScale > LARGEST_FONT_SCALE) return
        commit(SET_FONT_SCALE, state.fontScale + 0.1)
      },
      async getBooks({ commit, state }) {
        const books = await state.client?.getBooksForVersion(
          state.versionUid
        );
        commit(SET_BOOKS, books);
      },
      async getChapter({ commit, state }, { book, versionChapterNum }) {
        commit(SET_CHAPTER, { book, versionChapterNum, chapterContent: [] });
        const content = await state.client?.getFullDataForReferenceRange({
          bookOsisId: book.osisId, versionChapterNum, versionUid: state.versionUid
        })
        commit(SET_CHAPTER, {
          book,
          versionChapterNum,
          chapterContent: content?.content.contents
        });
      },
      async getStrongsDefinition({ commit, state }, strongsTags: string[]) {
        const normalizedStrongs = strongsTags.map(strong => new StrongsNumber(strong));
        const isHebrewStrongs = normalizedStrongs[0].id.startsWith('H');
        const dictionaries = isHebrewStrongs
          ? ['@BdbMedDef']
          : ['@MounceShortDef', '@MounceMedDef'];
        const requests = await Promise.all(
          normalizedStrongs.map(strong =>
            Promise.all(
              dictionaries.map(async dictionary => {
                const entries = await state.client?.getDictionaryEntry(
                  strong.id, dictionary
                );
                return entries
              })
            )
          )
        );
        const definitions = requests.map(request => StrongsDefinition.merge(request));
        commit(SET_STRONGS, { definitions });
        commit(SET_STRONGS_MODAL, true);
      },
      setStrongsModal({ commit }, { strongsModal }) {
        commit(SET_STRONGS_MODAL, strongsModal);
      }
    },
    strict: !!process.env.DEV
  });

  return Store;
});
