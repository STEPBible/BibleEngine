<template>
    <v-app>
        <v-app-bar app>
            <v-btn icon>
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
                    <v-card ripple v-for="(book, index) in books" :key="`book-${index}`">
                        <v-card-title>
                            {{ book.abbreviation }}
                        </v-card-title>
                        <v-card-subtitle>
                            {{ book.title }}
                        </v-card-subtitle>
                    </v-card>
                </v-tab-item>
                <v-tab-item>
                    Chapters
                </v-tab-item>
            </v-tabs-items>
        </v-content>
    </v-app>
</template>
<script>
import { mapState } from 'vuex';
export default {
    data() {
        return {
            tab: null
        };
    },
    computed: {
        ...mapState(['books'])
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
    min-width: 120px;
}
</style>
