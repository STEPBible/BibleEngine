import Vue from 'vue';
import Vuex from 'vuex';
import BibleApi from './BibleApi';

const SET_BOOKS = 'SET_BOOKS';
const SET_CHAPTER = 'SET_CHAPTER';
const SET_STRONGS = 'SET_STRONGS';
const SET_STRONGS_MODAL = 'SET_STRONGS_MODAL';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        books: [],
        book: null,
        chapterContent: null,
        strongsDefinitions: null,
        strongsModal: false,
        versionChapterNum: 1,
        versionUid: 'ESV'
    },
    mutations: {
        [SET_BOOKS](state, books) {
            state.books = books;
        },
        [SET_CHAPTER](state, { book, versionChapterNum, chapterContent }) {
            state.book = book;
            state.versionChapterNum = versionChapterNum;
            state.chapterContent = chapterContent;
        },
        [SET_STRONGS](state, { definitions }) {
            state.strongsDefinitions = definitions;
        },
        [SET_STRONGS_MODAL](state, strongsModal) {
            state.strongsModal = strongsModal;
        }
    },
    actions: {
        async getBooks({ commit }) {
            const books = await BibleApi.getBooks();
            commit(SET_BOOKS, books);
        },
        async getChapter({ commit }, { book, versionChapterNum }) {
            const chapterContent = await BibleApi.getChapter(book.osisId, versionChapterNum);
            commit(SET_CHAPTER, { book, versionChapterNum, chapterContent });
        },
        async getStrongsDefinition({ commit }, strongsTags: string[]) {
            const definitions = await BibleApi.getStrongsDefinitions(strongsTags);
            commit(SET_STRONGS, { definitions });
            commit(SET_STRONGS_MODAL, true);
        },
        async setStrongsModal({ commit }, { strongsModal }) {
            commit(SET_STRONGS_MODAL, strongsModal);
        }
    }
});
