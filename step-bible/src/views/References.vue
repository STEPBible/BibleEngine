<template>
    <v-app>
        <v-app-bar app>
            <v-btn @click="goBack" icon>
                <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <v-toolbar-title>References</v-toolbar-title>
            <v-spacer></v-spacer>
            <template v-slot:extension>
                <v-tabs v-model="tab" dark centered grow>
                    <v-tab>
                        Books
                    </v-tab>
                    <v-tab>
                        Chapters
                    </v-tab>
                </v-tabs>
            </template>
        </v-app-bar>
        <v-content>
            <v-tabs-items v-model="tab">
                <v-tab-item>
                    <v-card
                        ripple
                        v-for="(book, index) in books"
                        :key="`book-${index}`"
                        class="book-card"
                        @click="onBookSelect(book)"
                    >
                        <v-card-title>
                            {{ book.abbreviation }}
                        </v-card-title>
                        <v-card-subtitle>
                            {{ book.title }}
                        </v-card-subtitle>
                    </v-card>
                </v-tab-item>
                <v-tab-item>
                    <v-card
                        class="chapter-card"
                        ripple
                        v-for="chapterNumber in chapterNumbers"
                        :key="`chapter-${chapterNumber}`"
                        @click="onChapterSelect(chapterNumber)"
                    >
                        <v-card-title class="chapter-card__title">
                            {{ chapterNumber }}
                        </v-card-title>
                    </v-card>
                </v-tab-item>
            </v-tabs-items>
        </v-content>
    </v-app>
</template>
<script>
import { mapState, mapActions } from 'vuex';
export default {
    data() {
        return {
            tab: null,
            selectedBook: null
        };
    },
    computed: {
        ...mapState(['books']),
        chapterNumbers() {
            return [...Array(this.selectedBook?.chaptersCount.length + 1 || 0).keys()].slice(1);
        }
    },
    methods: {
        ...mapActions(['getChapter']),
        onBookSelect(book) {
            this.selectedBook = book;
            this.tab = 1;
        },
        async onChapterSelect(versionChapterNum) {
            this.goBack();
            await this.getChapter({ book: this.selectedBook, versionChapterNum });
        },
        goBack() {
            this.$router.go(-1);
        }
    }
};
</script>
<style>
.v-window-item {
    display: flex;
    flex-wrap: wrap;
}
.v-card {
    flex: 1;
}
.book-card {
    min-width: 120px;
}
.chapter-card {
    min-width: 80px;
}
.chapter-card__title {
    align-items: center;
    display: flex;
    justify-content: center;
}
</style>
