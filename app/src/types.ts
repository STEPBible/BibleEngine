import { IBibleContent, IBibleReferenceRange } from '@bible-engine/core'

export interface ChapterResult {
  contents: IBibleContent[]
  nextChapter?: IBibleReferenceRange
}
