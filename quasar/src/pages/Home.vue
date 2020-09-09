<template>
  <q-layout>
    <q-header reveal>
      <q-toolbar class="flex">
        <span class="toolbar__content">
          <q-btn flat round dense icon="more_vert" @click="openBottomSheet" />
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
      <bottom-sheet ref="swipeableBottomSheet">
        <div class="font-size center">
          <q-btn class="font-size__button font-size__button--decrease center">A-</q-btn>
          <q-btn class="font-size__button font-size__button--increase center">A+</q-btn>
        </div>
      </bottom-sheet>
      <template v-if="chapterContent">
        <BibleSection v-for="(section, index) in chapterContent" :key="index" :section="section" />
      </template>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';
import BottomSheet from 'components/BottomSheet.vue';
import BibleSection from 'components/BibleSection.vue';
import StrongsModal from 'components/StrongsModal.vue';
import { PassageUrl } from 'src/models/PassageUrl';
export default Vue.extend({
  name: 'Home',
  components: { BibleSection, StrongsModal, BottomSheet },
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
    openBottomSheet() {
      this.$refs.swipeableBottomSheet.setState('half');
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
<style lang="scss">
a {
  text-decoration: none;
}
html {
  overflow: scroll;
  overflow-x: hidden;
}
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}
.q-layout__section--marginal {
  background-color: #121212;
}
.toolbar__content {
  display: flex;
  justify-content: space-between;
  left: 8px;
  right: 8px;
  position: absolute;
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
.font-size {
  font-size: 2rem;
  height: 4rem;
  padding-top: 2rem;
}
.font-size__button {
  background: #747474;
  border-radius: 0.1em;
  font-size: 1.5rem;
  height: 4rem;
  width: 8rem;

  &--decrease {
    margin-right: 1em;
  }
  &--increase {
    font-size: 2rem;
  }
}
</style>
