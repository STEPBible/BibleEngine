<template>
  <q-layout>
    <q-header reveal class="bg-white">
      <q-toolbar class="text-primary flex-grow">
        <q-input :value="input" @input="onInput" clearable borderless autofocus>
          <q-btn slot="prepend" flat round dense icon="arrow_back" />
        </q-input>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <div class="result" v-for="result in results" :key="result.ref">
        <q-icon class="result__icon" name="search" />
        <div class="result__content">
          <div class="result__content__body">{{ result.verseContent }}</div>
          <div class="result__content__reference">{{ `${result.reference}` }}</div>
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>
<script lang="ts">
import Vue from 'vue';
const index = import('src/assets/esvSearchIndex.json');
import * as elasticlunr from 'elasticlunr';
export default Vue.extend({
  data: () => ({
    index: null,
    input: '',
    lunrSearchEngine: null,
    results: [],
  }),
  methods: {
    onInput(input: string) {
      if (!this.lunrSearchEngine) {
        return;
      }
      this.input = input;
      const MAX_NUM_RESULTS = 10;
      this.results = this.lunrSearchEngine
        ?.search(input, {})
        .slice(0, MAX_NUM_RESULTS)
        .map((result: any) => result.ref)
        .map((ref: any) => ({
          reference: ref,
          verseContent: this.index?.documentStore?.docs[ref].vc[0],
          verseNum: this.index?.documentStore?.docs[ref].v,
          versionChapterNum: this.index?.documentStore?.docs[ref].c,
          bookOsisId: this.index?.documentStore?.docs[ref].b,
        }));
    },
  },
  async mounted() {
    this.index = await index;
    this.lunrSearchEngine = elasticlunr.Index.load(this.index);
  },
});
</script>
<style scoped>
.q-input {
  font-size: 18px;
  width: 100%;
}
.q-toolbar {
  border-bottom: 1px solid #e6e6e6;
}
.result {
  align-items: center;
  display: flex;
  padding: 8px 16px 8px 18px;
  position: relative;
}
.result__icon {
  color: #9b9b9b;
  font-size: 24px;
}
.result__content {
  font-size: 17px;
  margin-left: 16px;
}
.result__content__reference {
  color: #898989;
  font-size: 13px;
}
</style>
