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
        feedbackEmail() {
            const EMAIL = 'TyndaleSTEP@gmail.com';
            const SUBJECT = 'STEP Bible App Feedback';
            const BODY = '';
            return `mailto:${EMAIL}?subject=${SUBJECT}&body=${BODY}`;
        }
    },
    methods: {
        ...mapActions(['decreaseFontSize', 'increaseFontSize'])
    }
});
</script>
<style scoped>
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
    height: 100px;
    margin: 8px;
    width: 120px;
    user-select: none;
}
.settings__feedback {
    margin-top: 24px;
}
</style>
