<template>
    <div id="app">
        <div id="nav">
            <router-link to="/">Home</router-link> |
            <router-link to="/about">About</router-link>
        </div>
        <router-view />
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
    name: 'App',

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
