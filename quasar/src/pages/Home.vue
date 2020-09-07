<template>
  <q-layout view="lHh lpr lFf" class="shadow-2 rounded-borders">
    <q-header reveal>
      <q-toolbar style="display: flex;">
        <span
          style="display: flex; justify-content: space-between; left: 8px; right: 8px; position: absolute;"
        >
          <q-btn flat round dense icon="more_vert" />
          <span class="v-toolbar__content__picker">
            <router-link to="/references">
              <q-btn outline class="picker__option">
                <span class="v-toolbar__content__picker__ref">{{ bookAndChapterReference }}</span>
              </q-btn>
            </router-link>
            <q-btn outline class="picker__option picker__version">ESV</q-btn>
          </span>
          <q-btn flat round dense icon="search" @click="goToSearch" />
        </span>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <strongs-modal />
      <template v-if="chapterContent">
        <BibleSection v-for="(section, index) in chapterContent" :key="index" :section="section" />
      </template>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import BibleSection from 'components/BibleSection.vue';
import StrongsModal from 'components/StrongsModal.vue';
import { PassageUrl } from 'src/models/PassageUrl';
export default Vue.extend({
  name: 'Home',
  components: { BibleSection, StrongsModal },
  props: {
    passage: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    ...mapState([
      'chapterContent',
      'versionChapterNum',
      'book',
      'strongsDefinitions',
    ]),
    bookAndChapterReference() {
      return `${this.book?.osisId} ${this.versionChapterNum}`;
    },
    bookName() {
      return this.book?.osisId;
    },
  },
  methods: {
    ...mapActions(['getBooks', 'getChapter']),
    goToSearch() {
      this.$router.push('/search');
    },
  },
  async mounted() {
    const url = PassageUrl.parse(this.passage);
    await this.getChapter({
      book: { osisId: url.book },
      versionChapterNum: url.chapter,
    });
    const verseId = `${url.book}-${url.chapter}:${url.verse}`;
    const element = document.getElementById(verseId);
    element?.scrollIntoView();
    this.getBooks();
  },
  data: () => ({
    showBottomSheet: false,
  }),
});
</script>
<style>
a {
  text-decoration: none;
}
.icon--left {
  position: absolute;
  left: 16px;
}
.icon--right {
  position: absolute;
  right: 16px;
}
.picker__option {
  color: white;
}
.picker__version {
  margin-left: 4px;
}
.page {
  padding-top: 24px;
  max-width: 800px;
}
.tippy-tooltip {
  background: black;
  padding: 8px;
}
</style>
