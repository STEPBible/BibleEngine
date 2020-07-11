import { DictionaryEntryEntity } from '@bible-engine/core';

export default class StrongsDefinition {
    static merge(definitions: (DictionaryEntryEntity | undefined)[]): DictionaryEntryEntity | null {
        if (definitions.length === 0) return null;
        const validDefinitions = definitions.filter(
            (definition): definition is DictionaryEntryEntity => definition !== undefined
        );
        if (validDefinitions.length === 0) return null;
        return validDefinitions.slice(1).reduce((mergedDefinition, definition) => {
            mergedDefinition?.content?.contents.push(...(definition?.content?.contents || []));
            return mergedDefinition;
        }, validDefinitions[0] || { content: { contents: [] } });
    }
}
