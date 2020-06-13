<template>
    <span>
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
        <template style="background: red; height: 100px; width: 100px;" v-else>
            {{
            content
            }}
        </template>
    </span>
</template>
<script>
import { mapActions } from 'vuex';
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
        async onStrongsClick(strongs) {
            await this.getStrongsDefinition(strongs);
            console.log(strongs);
        }
    }
};
</script>
<style>
.strongs {
    color: white;
}
</style>
