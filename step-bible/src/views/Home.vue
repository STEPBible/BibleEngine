<template>
<v-app>
    <v-app-bar app hide-on-scroll>
        <v-btn icon @click="showBottomSheet = !showBottomSheet">
            <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
        <div class="v-toolbar__content__picker">
            <router-link to="/references" class="picker__option picker__ref">
                <v-btn outlined>
                    <span class="ref__book">{{ bookName }}</span>
                    {{ versionChapterNum }}
                </v-btn>
            </router-link>
            <v-btn outlined class="picker__option picker__version">ESV</v-btn>
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
    <strongs-modal />
    <v-bottom-sheet v-model="showBottomSheet" inset>
        <bottom-sheet />
    </v-bottom-sheet>
</v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import BibleSection from '../components/BibleSection.vue';
import StrongsModal from '../components/StrongsModal.vue';
import BottomSheet from '../components/BottomSheet.vue';
export default Vue.extend({
    name: 'Home',
    components: {
        StrongsModal,
        BibleSection,
        BottomSheet
    },
    computed: {
        ...mapState(['chapterContent', 'versionChapterNum', 'book']),
        bookName() {
            return this.book?.title;
        }
    },
    methods: {
        ...mapActions(['getBooks'])
    },

    mounted() {
        this.getBooks();
    },

    data: () => ({
        showBottomSheet: false
    })
});
</script>
<style>
a {
    text-decoration: none;
}
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
    margin-right: 8px;
}
.ref__book {
    margin-right: 4px;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
