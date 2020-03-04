import { IBibleReferenceRange } from '@bible-engine/core'

export default class VerseReference {
  reference: string
  versionVerseNum: number
  versionChapterNum: number
  bookOsisId: string
  versionUid: string

  constructor(ref: string, versionUid: string) {
    this.reference = ref
    this.versionUid = versionUid
    this.bookOsisId = ref.split(' ')[0]
    this.versionChapterNum = Number(
      ref
        .split(' ')[1]
        .split(':')[0]
        .trim()
    )
    this.versionVerseNum = Number(
      ref
        .split(' ')[1]
        .split(':')[1]
        .trim()
    )
  }

  get range(): IBibleReferenceRange {
    return { ...this }
  }
}
