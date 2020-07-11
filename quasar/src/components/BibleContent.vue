<template>
  <span :style="fontScaleStyle">
    <p v-if="content.groupType">
      <bible-content
        v-for="(child, index) in content.contents"
        :key="`paragraph-${index}`"
        :content="child"
      />
    </p>
    <span v-if="content.numbering" class="verse-number">
      {{
      content.numbering.versionVerseIsStarting
      }}
    </span>
    <span
      class="strongs"
      v-else-if="content.strongs"
      @click="onStrongsClick(content.strongs)"
    >{{ `${content.content} ` }}</span>
    <template v-else-if="!('type' in content)">{{ `${content.content} ` }}</template>
  </span>
</template>
<script lang="ts">
import { mapActions, mapGetters } from 'vuex';
export default {
  name: 'BibleContent',
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions(['getStrongsDefinition']),
    async onStrongsClick(strongs: any) {
      await this.getStrongsDefinition(strongs);
      console.log(strongs);
    }
  },
  computed: {
    ...mapGetters(['fontScaleStyle'])
  }
};
</script>
<style>
.content {
  background: red;
  font-size: 1.2em;
}
.strongs {
  cursor: pointer;
  font-weight: bold;
}
.strongs:active {
  background: #2196f3;
}
.verse-number {
  font-size: 0.8em;
  font-weight: 500;
  vertical-align: super;
}
.theme--dark.v-application {
  color: #bdbdbd !important;
}
.theme--light.v-application {
  color: #212121 !important;
}
</style>