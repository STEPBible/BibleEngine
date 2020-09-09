<template>
  <div>
    <div>
      <q-card>
        <q-tabs
          v-model="tab"
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="justify"
        >
          <q-tab name="books" label="books" />
          <q-tab name="chapters" label="chapters" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="books">
            <q-card
              v-for="(book, index) in books"
              :key="`book-${index}`"
              class="book-card"
              @click="onBookSelect(book)"
            >
              <div class="text-h6">{{ book.abbreviation }}</div>
              {{ book.abbreviation }}
            </q-card>
          </q-tab-panel>
          <q-tab-panel name="chapters">
            <q-card
              v-for="(number, index) in chapterNumbers"
              :key="`book-${index}`"
              class="book-card"
              @click="onChapterSelect(number)"
            >
              <div class="text-h6">{{ number }}</div>
            </q-card>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex';
export default {
  data() {
    return {
      tab: 'books',
      selectedBook: null,
    };
  },
  computed: {
    ...mapState(['books']),
    chapterNumbers() {
      return [
        ...Array(this.selectedBook?.chaptersCount.length + 1 || 0).keys(),
      ].slice(1);
    },
  },
  mounted() {
    this.getBooks();
  },
  methods: {
    ...mapActions(['getChapter', 'getBooks']),
    onBookSelect(book) {
      this.selectedBook = book;
      this.tab = 'chapters';
    },
    async onChapterSelect(versionChapterNum) {
      this.$router.push(`/${this.selectedBook.osisId}+${versionChapterNum}`);
    },
    goBack() {
      this.$router.go(-1);
    },
  },
};
</script>
<style>
.q-window-item {
  display: flex;
  flex-wrap: wrap;
}
.q-card {
  flex: 1;
}
.book-card {
  min-width: 120px;
}
.chapter-card {
  min-width: 80px;
}
.chapter-card__title {
  align-items: center;
  display: flex;
  justify-content: center;
}
</style>