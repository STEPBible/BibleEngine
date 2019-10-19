import { BibleEngineClient } from '../BibleEngineClient';

describe('BibleEngineClient', () => {
    describe('chunk', () => {
        test('array is split up into chunks correctly', () => {
            expect(BibleEngineClient.chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
                [1, 2],
                [3, 4],
                [5, 6]
            ]);
        });
    });
});
