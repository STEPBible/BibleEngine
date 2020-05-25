<template>
    <v-app>
        <v-app-bar app collapsable inline-flex>
            <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
            <div class="v-toolbar__content__picker">
                <v-btn outlined class="picker__option picker__ref">
                    Genesis 1
                </v-btn>
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
            <HelloWorld />
        </v-content>
    </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import HelloWorld from './components/HelloWorld.vue';

export default Vue.extend({
    name: 'App',

    components: {
        HelloWorld
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
