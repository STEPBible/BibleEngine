<template>
    <v-app>
        <v-app-bar app collapse-on-scrolls>
            <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
            <div class="v-toolbar__content__picker">
                <router-link to="/references" class="picker__option picker__ref">
                    <v-btn outlined>
                        Genesis 1
                    </v-btn>
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
            {{ chapterContent }}
        </v-content>
    </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
    name: 'Home',
    computed: {
        ...mapState(['chapterContent'])
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
    width: 195px;
}
.picker__ref {
    margin-left: 8px;
    min-width: 120px;
}
.picker__version {
    min-width: 60px;
}
</style>
