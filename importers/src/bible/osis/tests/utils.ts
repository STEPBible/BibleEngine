import { BibleEngine, IBibleContentSection } from '@bible-engine/core';
import { ConnectionOptions } from 'typeorm';

const CONNECTION_OPTIONS: ConnectionOptions = {
    type: 'sqlite',
    database: ':memory:'
}

export const TEST_BIBLE_VERSION = {
    uid: 'NASB',
    title: 'New American Standard Bible',
    isPlaintext: false,
    hasStrongs: true,
}

export const getBibleEngineTestInstance = () => {
    return new BibleEngine(CONNECTION_OPTIONS)
}

export const getEmptySection = (): IBibleContentSection => {
    return {
        type: 'section',
        level: 0,
        contents: [],
    };
}