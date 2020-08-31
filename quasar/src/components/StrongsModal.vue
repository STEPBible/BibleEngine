<template>
  <q-dialog :value="strongsModal" @input="onStrongsModalUpdate">
    <q-card class="modal strongs-modal" outlined>
      <div
        v-for="(definition, index) in strongsDefinitions"
        :key="`strongs-${index}`"
        class="definition"
      >
        <span class="text-h6">{{ strongsTitle(definition) }}</span>
        <strongs-content
          v-for="(item, index) in definition.content.contents"
          :item="item"
          :key="`strongs-${index}`"
        />
      </div>
    </q-card>
  </q-dialog>
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
.definition {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.text-h6 {
  text-align: left;
}
.modal {
  height: 50%;
  padding: 16px;
}
</style>