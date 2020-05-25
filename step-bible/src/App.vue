<template>
    <v-app>
        <v-app-bar app collapsable>
            <div class="app__nav">
                <v-btn icon class="app__nav__left">
                    <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
                <v-btn icon class="app__nav__right">
                    <v-icon>mdi-magnify</v-icon>
                </v-btn>
            </div>
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
<style scoped>
.app__nav {
    align-items: center;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    width: 100%;
    height: 100%;
    left: 0;
    top: 2px;
    bottom: 0;
}
.app__nav__left {
    position: absolute;
}
.app__nav__right {
    position: absolute;
    right: 0;
    top: 2px;
    bottom: 0;
}
</style>
