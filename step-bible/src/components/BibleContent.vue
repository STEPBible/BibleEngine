<template>
    <span :style="fontScaleStyle">
        <p v-if="content.groupType">
            <bible-content
                v-for="(child, index) in content.contents"
                :key="`paragraph-${index}`"
                :content="child"
            />
        </p>
        <strong
            class="strongs"
            v-else-if="content.strongs"
            @click="onStrongsClick(content.strongs)"
        >{{ `${content.content} ` }}</strong>
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
    font-weight: bold;
}
</style>
