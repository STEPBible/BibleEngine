import { DictionaryEntryEntity } from '@bible-engine/core'

export default class StrongsDefinition {
  static merge(
    definitions: DictionaryEntryEntity[]
  ): DictionaryEntryEntity | null {
    if (definitions.length === 0) return null
    const validDefinitions = definitions.filter(
      (definition) => definition !== undefined
    )
    if (validDefinitions.length === 0) return null
    const content =
      validDefinitions
        .map((definition) =>
          definition?.content
            ?.replace(/<ref=/g, '<span attr=')
            .replace(/<\/ref>/g, '</span>')
            .replace(/<a /g, '<span ')
            .replace(/<\/a>/g, '</span>')
            .replace(/<Level[\d]>/g, '<br/>')
            .replace(/<\/Level[\d]>/g, '')
            .replace(/<greek>/g, '')
            .replace(/<\/greek>/g, '')
        )
        .join('<br/><br/>') || ''
    return { ...validDefinitions[0], content }
  }
}
