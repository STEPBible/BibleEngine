<template>
  <div>
    <div v-if="isPhrase" class="phrase">{{ item.content }}</div>
    <div v-else-if="isBoldedGroup">
      <span
        v-for="(phrase, phraseIndex) in childPhrases"
        :key="`bolded-group-${phraseIndex}`"
        class="phrase--bold"
      >{{ phrase }}</span>
    </div>
    <div v-else-if="isGroup" class="group">
      <strongs-content
        v-for="(content, index) in item.contents"
        :key="`content-${index}`"
        :item="content"
      />
    </div>
  </div>
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
.group {
  display: flex;
  overflow: scroll;
}
</style>
