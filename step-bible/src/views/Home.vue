<template>
<v-app>
    <v-app-bar app hide-on-scroll>
        <v-btn class="icon--left" icon @click="showBottomSheet = !showBottomSheet">
            <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
        <div class="v-toolbar__content__picker">
            <router-link to="/references">
                <v-btn outlined>
                    <span class="v-toolbar__content__picker__ref">{{ bookAndChapterReference }}</span>
                </v-btn>
            </router-link>
            <v-btn outlined class="picker__option picker__version">ESV</v-btn>
        </div>
        <v-btn class="icon--right" icon>
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
    <v-bottom-sheet v-model="showBottomSheet" inset scrollable>
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
        bookAndChapterReference() {
            return `${this.book?.osisId} ${this.versionChapterNum}`;
        },
        bookName() {
            return this.book?.osisId;
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
.icon--left {
    position: absolute;
    left: 16px;
}
.icon--right {
    position: absolute;
    right: 16px;
}
.v-toolbar__content {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
}
.v-toolbar__content__picker {
    display: flex;
    justify-content: center;
    left: 56px;
    position: absolute;
    right: 56px;
}
.picker__version {
    margin-left: 4px;
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
