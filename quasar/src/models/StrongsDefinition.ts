export default class StrongsDefinition {
    static merge(definitions: (any | undefined)[]): any | null {
        if (definitions.length === 0) return null;
        const validDefinitions = definitions.filter(
            (definition) => definition !== undefined
        );
        if (validDefinitions.length === 0) return null;
        return validDefinitions.slice(1).reduce((mergedDefinition, definition) => {
            mergedDefinition?.content?.contents.push(...(definition?.content?.contents || []));
            return mergedDefinition;
        }, validDefinitions[0] || { content: { contents: [] } });
    }
}
