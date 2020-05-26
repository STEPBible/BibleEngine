import Vue from 'vue';
import Vuex from 'vuex';
import BibleApi from './BibleApi';

const SET_BOOKS = 'SET_BOOKS';
const SET_CHAPTER = 'SET_CHAPTER';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        books: [],
        book: null,
        chapterContent: null,
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
        }
    }
});
