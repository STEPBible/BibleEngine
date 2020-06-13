<template>
    <v-card class="settings center outlined">
        <div class="settings__font-size">
            <div class="font-size__buttons center">
                <v-card
                    class="font-size__buttons__tile center"
                    ripple
                    outlined
                    @click="decreaseFontSize"
                >
                    <h2>A-</h2>
                </v-card>
                <v-card
                    class="font-size__buttons__tile center"
                    ripple
                    outlined
                    @click="increaseFontSize"
                >
                    <h1>A+</h1>
                </v-card>
            </div>
        </div>
        <v-card class="center settings__colors" outlined>
            <div outlined class="center colors__circle" @click="disableDarkMode">
                <v-icon v-if="darkModeEnabled === false">mdi-check</v-icon>
            </div>
            <div
                outlined
                class="center colors__circle colors__circle--dark"
                @click="enabledDarkMode"
            >
                <v-icon v-if="darkModeEnabled">mdi-check</v-icon>
            </div>
        </v-card>
        <v-btn class="settings__feedback" text :href="feedbackEmail">
            <v-icon left>mdi-pencil</v-icon>Send Feedback
        </v-btn>
    </v-card>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
export default Vue.extend({
    data() {
        return {};
    },
    computed: {
        darkModeEnabled() {
            return this.$vuetify.theme.dark;
        },
        feedbackEmail() {
            const EMAIL = 'TyndaleSTEP@gmail.com';
            const SUBJECT = 'STEP Bible App Feedback';
            const BODY = '';
            return `mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`;
        }
    },
    methods: {
        ...mapActions(['decreaseFontSize', 'increaseFontSize']),
        disableDarkMode() {
            this.$vuetify.theme.dark = false;
        },
        enabledDarkMode() {
            this.$vuetify.theme.dark = true;
        }
    }
});
</script>
<style>
.center {
    align-items: center;
    display: flex;
    justify-content: center;
}
.settings {
    flex-direction: column;
    padding: 24px;
}
.font-size__buttons__tile {
    height: 60px;
    margin: 8px;
    width: 120px;
    user-select: none;
}
.colors__circle {
    background: white;
    border: 1px solid gray;
    border-radius: 25px !important;
    height: 50px;
    margin: 8px;
    width: 50px;
}
.colors__circle--dark {
    background: black;
}
.settings__feedback {
    margin-top: 16px;
}
</style>
