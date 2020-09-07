<template>
  <div class="section">
    <h3 v-if="section.title" class="section__title" :style="fontScaleStyle">{{ section.title }}</h3>
    <div v-for="(content, index) in section.contents" :key="`section-content-${index}`">
      <bible-content :content="content" :index="index" />
    </div>
  </div>
</template>
<script lang="ts">
import BibleContent from './BibleContent.vue';
import { mapGetters } from 'vuex';
export default {
  components: {
    BibleContent,
  },
  props: {
    section: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters(['fontScaleStyle']),
  },
};
</script>
<style scoped>
.section {
  font-size: 17px;
  padding: 0px 16px 0px 16px;
}
.section__title {
  font-size: 17px;
  margin-bottom: 4px;
}
</style>