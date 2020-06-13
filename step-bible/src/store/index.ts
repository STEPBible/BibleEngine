import Vue from 'vue';
import Vuex from 'vuex';
import BibleApi from './BibleApi';

const SET_BOOKS = 'SET_BOOKS';
const SET_CHAPTER = 'SET_CHAPTER';
const SET_FONT_SCALE = 'SET_FONT_SCALE';
const SET_STRONGS = 'SET_STRONGS';
const SET_STRONGS_MODAL = 'SET_STRONGS_MODAL';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        books: [],
        book: null,
        chapterContent: null,
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
        async decreaseFontSize({ commit, state }) {
            const SMALLEST_FONT_SCALE = 0.5
            if (state.fontScale < SMALLEST_FONT_SCALE) return
            commit(SET_FONT_SCALE, state.fontScale - 0.1)
        },
        async increaseFontSize({ commit, state }) {
            const LARGEST_FONT_SCALE = 2.2
            if (state.fontScale > LARGEST_FONT_SCALE) return
            commit(SET_FONT_SCALE, state.fontScale + 0.1)
        },
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
