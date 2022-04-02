import StrongsDefinition from '../../models/StrongsDefinition'
import { DictionaryEntryEntity } from '@bible-engine/core'

describe('merge', () => {
  const DEFINITIONS: DictionaryEntryEntity[] = [
    {
      strong: 'G0004',
      dictionary: '@MounceMedDef',
      lemma: 'ἀβαρής',
      transliteration: 'abarḗs',
      gloss: 'not burdensome',
      content:
        "not burdensome <br />literally: <b>weightless</b>; <ref='2Co.11.9'>2Cor. 11:9</ref>*",
    },
    {
      strong: 'G0004',
      dictionary: '@FLsjDefs',
      lemma: 'ἀβαρής',
      transliteration: 'abarḗs',
      gloss: 'not burdensome',
      content:
          'γῆ[<a href="javascript:void(0)" title=" “Anthologia Graeca”">Refs 1st c.BC+</a>]<Level2><b>__II</b></Level2><greek>πέτρα</greek>',
  },
  ]
  it('keeps metadata but combines the definition document trees', () => {
    const LsjWithoutLinks = 'γῆ[<span href="javascript:void(0)" title=" “Anthologia Graeca”">Refs 1st c.BC+</span>]<br/><b>__II</b>πέτρα'
    const htmlWithFixedTags = 'not burdensome <br />literally: <b>weightless</b>; <span attr=\'2Co.11.9\'>2Cor. 11:9</span>*'
    const EXPECTED_DEFINITION: DictionaryEntryEntity = {
      ...DEFINITIONS[0],
      content: `${htmlWithFixedTags}<br/><br/>${LsjWithoutLinks}`,
    }
    const definition = StrongsDefinition.merge(DEFINITIONS)
    expect(definition).toEqual(EXPECTED_DEFINITION)
  })
  it('returns a renderable, blank definition if given undefined inputs', () => {
    expect(StrongsDefinition.merge([])).toBe(null)
    expect(StrongsDefinition.merge([undefined, undefined] as any)).toBe(null)
  })
})
