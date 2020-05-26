<template>
    <div id="app">
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
