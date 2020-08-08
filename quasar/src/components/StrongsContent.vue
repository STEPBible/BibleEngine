<template>
  <span>
    <span v-if="isPhrase" class="phrase">{{ item.content }}</span>
    <span v-else-if="isBoldedGroup">
      <span
        v-for="(phrase, phraseIndex) in childPhrases"
        :key="`bolded-group-${phraseIndex}`"
        class="phrase--bold"
      >{{ phrase }}</span>
    </span>
    <div v-else-if="isGroup">
      <strongs-content
        v-for="(content, index) in item.contents"
        :key="`content-${index}`"
        :item="content"
      />
    </div>
  </span>
</template>
<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'StrongsContent',
  props: {
    item: {
      type: Object as () => any,
      required: true,
    },
  },
  computed: {
    isPhrase(): boolean {
      return this.item?.type === 'phrase';
    },
    isGroup(): boolean {
      return this.item?.type === 'group';
    },
    isBoldedGroup(): boolean {
      return this.isGroup && this.item?.groupType === 'bold';
    },
    childPhrases(): boolean {
      return this.item?.contents?.map(({ content }: any) => content) || [];
    },
  },
});
</script>
<style scoped>
.phrase--bold {
  font-weight: bold;
}
</style>
