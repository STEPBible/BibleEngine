<template>
    <v-dialog :value="strongsModal" @input="onStrongsModalUpdate" class="dialog">
        <v-card class="modal">
            <div
                v-for="(definition, index) in strongsDefinitions"
                :key="`strongs-${index}`"
                class="definition"
            >
                <v-card-title>{{ strongsTitle(definition) }}</v-card-title>
                <v-card-subtitle>
                    <strongs-content
                        v-for="(item, index) in definition.content.contents"
                        :item="item"
                        :key="`strongs-${index}`"
                    />
                </v-card-subtitle>
            </div>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import { mapState, mapActions } from 'vuex';
import StrongsContent from './StrongsContent.vue';
export default {
    components: {
        StrongsContent
    },
    data() {
        return {
            dialog: true
        };
    },
    methods: {
        ...mapActions(['setStrongsModal']),
        onStrongsModalUpdate(value: boolean) {
            this.setStrongsModal(value);
        },
        strongsTitle(definition: any) {
            return `'${definition?.gloss}' (${definition.transliteration} - ${definition.lemma})`;
        }
    },
    computed: {
        ...mapState(['strongsModal', 'strongsDefinitions'])
    }
};
</script>
<style>
.v-dialog:not(.v-dialog--fullscreen) {
    max-height: 50% !important;
}
.modal {
    height: 50%;
}
</style>
