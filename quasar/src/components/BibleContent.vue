<template>
  <span :style="fontScaleStyle">
    <p v-if="content.groupType" class="paragraph">
      <bible-content
        v-for="(child, childIndex) in content.contents"
        :key="`paragraph-${index}-${childIndex}`"
        :content="child"
        :index="childIndex * 1000"
      />
    </p>
    <div v-if="content.numbering" class="verse-number">
      {{
      content.numbering.versionVerseIsStarting
      }}
    </div>
    <tippy v-else-if="content.strongs" :arrow="true" trigger="click">
      <template v-slot:trigger>
        <span
          @click="onStrongsClick(content.strongs)"
          class="phrase phrase--strongs"
        >{{ `${content.content} ` }}</span>
      </template>
      <strongs-modal />
    </tippy>
    <div class="phrase" v-else-if="!('type' in content)">{{ `${content.content} ` }}</div>
  </span>
</template>
<script lang="ts">
import { mapActions, mapGetters } from 'vuex';
import StrongsModal from '../components/StrongsModal.vue';
export default {
  name: 'BibleContent',
  components: { StrongsModal },
  props: {
    content: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {};
  },
  methods: {
    ...mapActions(['getStrongsDefinition']),
    async onStrongsClick(strongs: any) {
      console.log('onStrongsClick');
      await this.getStrongsDefinition(strongs);
      console.log(strongs);
    },
  },
  computed: {
    ...mapGetters(['fontScaleStyle']),
  },
};
</script>
<style>
.paragraph {
  display: flex;
  flex-wrap: wrap;
}
.content {
  background: red;
  font-size: 1.2em;
}
.phrase {
  margin-right: 0.3em;
}
.phrase--strongs {
  cursor: pointer;
  font-weight: 500;
}
.strongs:active {
  background: #2196f3;
}
.verse-number {
  font-size: 0.8em;
  font-weight: 500;
  margin-right: 0.2em;
  vertical-align: super;
}
.theme--dark.v-application {
  color: #bdbdbd !important;
}
.theme--light.v-application {
  color: #212121 !important;
}
</style>