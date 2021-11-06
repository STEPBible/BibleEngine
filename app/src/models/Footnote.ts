export class Footnote {
    static getPlainText(footnote: any) {
        return footnote.content.contents.map((phrase) => {
            if (phrase.groupType === 'emphasis') {
                const emphasizedContent = phrase.contents.map(content => content.content).join(' ')
                return `"${emphasizedContent}"`
            }
            return phrase.content
        }).join(' ')
    }
}