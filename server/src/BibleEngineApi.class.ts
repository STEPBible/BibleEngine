import { BibleEngine } from '@bible-engine/core';
import { ConnectionOptions } from 'typeorm';

export class BibleEngineApi {
    private bibleEngine: BibleEngine;
    constructor(options: ConnectionOptions) {
        this.bibleEngine = new BibleEngine(options);
    }
}
