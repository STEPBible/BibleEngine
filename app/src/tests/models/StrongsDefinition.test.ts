import StrongsDefinition from '../../models/StrongsDefinition'
import { DictionaryEntryEntity } from '@bible-engine/core'

describe('merge', () => {
  const DEFINITIONS: DictionaryEntryEntity[] = [
    {
      strong: 'G4625',
      dictionary: '@MounceShortDef',
      lemma: 'σκάνδαλον',
      transliteration: 'skándalon',
      gloss: 'stumbling block',
      content: {
        type: 'root',
        contents: [
          {
            type: 'phrase',
            content:
              'stumbling block, obstacle, offense; something that causes sin',
          },
        ],
      },
    },
    {
      strong: 'G4625',
      dictionary: '@MounceShortDef',
      lemma: 'σκάνδαλον',
      transliteration: 'skándalon',
      gloss: 'stumbling block',
      content: {
        type: 'root',
        contents: [
          { type: 'phrase', content: 'pr. ' },
          {
            type: 'group',
            groupType: 'bold',
            contents: [{ type: 'phrase', content: 'a trap-spring;' }],
          },
        ],
      },
    },
  ]
  it('keeps metadata but combines the definition document trees', () => {
    const EXPECTED_DEFINITION: DictionaryEntryEntity = {
      ...DEFINITIONS[0],
      ...DEFINITIONS[1],
      content: {
        type: 'root',
        contents: [
          ...(DEFINITIONS?.[0].content?.contents || []),
          ...(DEFINITIONS?.[1].content?.contents || []),
        ],
      },
    }
    const definition = StrongsDefinition.merge(DEFINITIONS)
    expect(definition).toEqual(EXPECTED_DEFINITION)
  })
  it('returns a renderable, blank definition if given undefined inputs', () => {
    expect(StrongsDefinition.merge([])).toBe(null)
    expect(StrongsDefinition.merge([undefined, undefined])).toBe(null)
    expect(StrongsDefinition.merge([undefined, DEFINITIONS[0]])).toEqual(
      DEFINITIONS[0]
    )
    expect(StrongsDefinition.merge([DEFINITIONS[0], undefined])).toEqual(
      DEFINITIONS[0]
    )
  })
})
