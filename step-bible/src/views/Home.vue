<template>
    <v-app>
        <v-app-bar app hide-on-scroll>
            <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
            <div class="v-toolbar__content__picker">
                <router-link to="/references" class="picker__option picker__ref">
                    <v-btn outlined> {{ bookAndChapterReference }} </v-btn>
                </router-link>
                <v-spacer />
                <v-btn outlined class="picker__option picker__version">
                    ESV
                </v-btn>
            </div>
            <v-btn icon>
                <v-icon>mdi-magnify</v-icon>
            </v-btn>
        </v-app-bar>
        <v-content>
            <body class="page">
                <template v-if="chapterContent">
                    <BibleSection
                        v-for="(section, index) in chapterContent"
                        :key="index"
                        :section="section"
                    />
                </template>
            </body>
        </v-content>
    </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import BibleSection from '../components/BibleSection.vue';
export default Vue.extend({
    name: 'Home',
    components: {
        BibleSection
    },
    computed: {
        ...mapState(['chapterContent', 'versionChapterNum', 'book']),
        bookAndChapterReference() {
            return `${this.book?.title} ${this.versionChapterNum}`;
        }
    },
    methods: {
        ...mapActions(['getBooks'])
    },

    mounted() {
        this.getBooks();
    },

    data: () => ({
        //
    })
});
</script>
<style>
.v-toolbar__content {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
}
.v-toolbar__content__picker {
    display: flex;
    width: auto;
}
.picker__ref {
    min-width: 120px;
}
.picker__version {
    min-width: 60px;
}
.v-content__wrap {
    display: flex;
    justify-content: center;
}
.page {
    padding-top: 24px;
    max-width: 800px;
}
</style>
