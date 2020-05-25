import Vue from 'vue';
import Vuex from 'vuex';
import BibleApi from './BibleApi';

const SET_BOOKS = 'SET_BOOKS';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        books: [],
        versionUid: 'ESV'
    },
    mutations: {
        [SET_BOOKS](state, books) {
            state.books = books;
        }
    },
    actions: {
        async getBooks({ commit }) {
            const books = await BibleApi.getBooks();
            commit(SET_BOOKS, books);
        }
    }
});
