<template>
  <div>
    <span :class="['toolbar__content', { 'toolbar__content--dark': $q.dark.isActive }]">
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
    <strongs-modal />
    <bottom-sheet ref="swipeableBottomSheet">
      <div class="font-size center">
        <q-btn
          @click="decreaseFontSize"
          class="font-size__button font-size__button--decrease center"
        >A-</q-btn>
        <q-btn
          @click="increaseFontSize"
          class="font-size__button font-size__button--increase center"
        >A+</q-btn>
      </div>
    </bottom-sheet>
    <q-scroll-area class="body">
      <BibleSection v-for="(section, index) in chapterContent" :key="index" :section="section" />
    </q-scroll-area>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from 'vuex';
import BottomSheet from 'components/BottomSheet.vue';
import BibleSection from 'components/BibleSection.vue';
import StrongsModal from 'components/StrongsModal.vue';
import { PassageUrl } from '../models/PassageUrl';
export default {
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
    ...mapActions([
      'getBooks',
      'getChapter',
      'decreaseFontSize',
      'loadDatabase',
      'increaseFontSize',
    ]),
    goToSearch() {
      this.$router.push('/search');
    },
    openBottomSheet() {
      this.$refs.swipeableBottomSheet.setState('half');
    },
  },
  async mounted() {
    const url = PassageUrl.parse(this.passage);
    await this.loadDatabase(url);
  },
  data: () => ({
    showBottomSheet: false,
  }),
};
</script>
<style lang="scss">
a {
  text-decoration: none;
}
html {
  overflow: scroll;
  overflow-x: hidden;
}
body.body--dark {
  color: #e1e1e1;
}
.body {
  height: 100vh;
  margin-top: 48px;
}
.q-scrollarea__thumb {
  visibility: hidden;
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
  left: 0;
  padding: 0.5rem;
  right: 0;
  position: fixed;
  top: 0;
}
.toolbar__content--dark {
  background: #1f1f1f;
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
