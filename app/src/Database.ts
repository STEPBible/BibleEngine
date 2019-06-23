import { BibleEngine } from '@bible-engine/core';
import { ChapterResult } from './types';

export default class Database {
  public static async getChapter(
    sqlBible: BibleEngine,
    bookOsisId: string,
    versionChapterNum: number
  ) {
    let chapterOutput;
    try {
      chapterOutput = await sqlBible.getFullDataForReferenceRange(
        {
          bookOsisId,
          versionChapterNum,
          versionUid: 'ESV'
        },
        true
      );
      let nextChapter;
      try {
        nextChapter = chapterOutput.contextRanges.normalizedChapter.nextRange;
      } catch (e) {}
      const result: ChapterResult = {
        nextChapter,
        contents: chapterOutput.content.contents
      };
      return result;
    } catch (error) {
      // TODO: fall back to network on database error
      throw error;
    }
  }

  public async executeSql(database: any, sql: any, params = []) {
    return new Promise((resolve, reject) =>
      database.transaction(tx => {
        tx.executeSql(
          sql,
          params,
          (_, { rows: { _array } }) => resolve(_array),
          (_, error) => reject(error)
        );
      })
    );
  }
}
