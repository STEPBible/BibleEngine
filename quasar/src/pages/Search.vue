<template>
  <q-layout>
    <q-header reveal class="bg-white">
      <q-toolbar class="text-primary flex-grow">
        <q-input :value="input" @input="onInput" clearable borderless autofocus>
          <q-btn slot="prepend" flat round dense icon="arrow_back" @click="goToHome" />
        </q-input>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <div
        class="result"
        v-for="result in results"
        :key="result.ref"
        @click="onResultClick(result.reference)"
        v-ripple
      >
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
import { PassageUrl } from 'src/models/PassageUrl';
const index = import('src/assets/verses.json');
const FlexSearch = require('flexsearch');
export default Vue.extend({
  data: () => ({
    index: null,
    input: '',
    flexSearch: new FlexSearch(),
    loading: true,
    results: [],
    versesToContent: {},
  }),
  methods: {
    async onInput(input: string) {
      this.input = input;
      if (!input) {
        this.results = [];
      }
      if (this.loading) {
        return;
      }
      const MAX_NUM_RESULTS = 10;
      await this.flexSearch.search(input, MAX_NUM_RESULTS, (results: any[]) => {
        this.results = results.map((ref: string) => ({
          reference: ref,
          verseContent: this.versesToContent[ref],
        }));
      });
    },
    searchResultUrl(reference: string) {
      console.log(reference);
      const { book, chapter, verse } = PassageUrl.parse(reference);
      const url = PassageUrl.build(book, chapter, verse);
      return `/${url}`;
    },
    onResultClick(reference: string) {
      const url = this.searchResultUrl(reference);
      this.$router.push(url);
    },
    goToHome() {
      this.$router.go(-1);
    },
  },
  async mounted() {
    this.loading = true;
    const { verses } = await index;
    this.flexSearch = new FlexSearch({
      suggest: true,
      threshold: 0,
      resolution: 1,
      async: true,
      worker: 4,
    });
    await Promise.all(
      verses.map(async (verse: any[]) => {
        const ref = verse[0];
        const content = verse[1];
        this.versesToContent[ref] = content;
        await this.flexSearch.add(ref, content);
      })
    );
    this.loading = false;
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
