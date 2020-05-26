<template>
    <div class="section">
        <h3 v-if="section.title" class="section__title">{{ section.title }}</h3>
        <div v-for="(content, index) in section.contents" :key="`section-content-${index}`">
            <bible-content :content="content" />
        </div>
    </div>
</template>
<script>
import BibleContent from './BibleContent';
export default {
    components: {
        BibleContent
    },
    props: {
        section: {
            type: Object,
            required: true
        }
    }
};
</script>
<style scoped>
.section {
    font-size: 17px;
    padding: 0px 24px 0px 24px;
}
.section__title {
    font-size: 17px;
    margin-bottom: 4px;
}
</style>
