<template>
  <q-card class="modal strongs-modal" outlined>
    <div
      v-for="(definition, index) in strongsDefinitions"
      :key="`strongs-${index}`"
      class="definition"
    >
      <div>{{ strongsTitle(definition) }}</div>
      <div>
        <strongs-content
          v-for="(item, index) in definition.content.contents"
          :item="item"
          :key="`strongs-${index}`"
        />
      </div>
    </div>
  </q-card>
</template>
<script lang="ts">
import { mapState, mapActions } from 'vuex';
import StrongsContent from './StrongsContent.vue';
export default {
  components: {
    StrongsContent,
  },
  data() {
    return {
      dialog: true,
    };
  },
  methods: {
    ...mapActions(['setStrongsModal']),
    onStrongsModalUpdate(value: boolean) {
      this.setStrongsModal(value);
    },
    strongsTitle(definition: any) {
      return `'${definition?.gloss}' (${definition.transliteration} - ${definition.lemma})`;
    },
  },
  computed: {
    ...mapState(['strongsModal', 'strongsDefinitions']),
  },
};
</script>
<style>
.v-dialog:not(.v-dialog--fullscreen) {
  max-height: 50% !important;
}
.modal {
  background: black;
  height: 50%;
}
</style>