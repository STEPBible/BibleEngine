<template>
    <v-dialog :value="strongsModal" @input="onStrongsModalUpdate">
        <v-card class="">
            <v-card-title>
                {{ strongsDefinition }}
            </v-card-title>
            <v-card-subtitle>
                asdkfjkajfdjf
            </v-card-subtitle>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { mapState, mapActions } from 'vuex';
export default {
    data() {
        return {
            dialog: true
        };
    },
    methods: {
        ...mapActions(['setStrongsModal']),
        onStrongsModalUpdate(value: boolean) {
            this.setStrongsModal(value);
        }
    },
    computed: {
        ...mapState(['strongsModal', 'strongsDefinition'])
    }
};
</script>
<style>
.dialog {
}
</style>
