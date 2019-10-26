import { BibleBookPlaintext } from '../../models';
import { isTestMatching } from '../../functions/v11n.functions';

describe('isTestMatching', () => {
    const context: BibleBookPlaintext = new Map([
        [1, new Map([[1, ['in the beginning', 'god created']], [2, ['let there be light']]])],
        [2, new Map([[1, ['Test words with numbers 123 and more words']]])]
    ]);

    test('should match exist test if reference exists', () => {
        expect(isTestMatching('Gen.1:2=Exist', context)).toBe(true);
        expect(isTestMatching('Gen.1:2=NotExist', context)).toBe(false);
    });
    test('should fail exist test if reference not exists', () => {
        expect(isTestMatching('Gen.1:3=Exist', context)).toBe(false);
        expect(isTestMatching('Gen.1:3=NotExist', context)).toBe(true);
    });
    test('should match LAST test if reference is last', () => {
        expect(isTestMatching('Gen.1:2=Last', context)).toBe(true);
    });
    test('should fail LAST test if reference is not last or not existing', () => {
        expect(isTestMatching('Gen.1:1=Last', context)).toBe(false);
        expect(isTestMatching('Gen.1:3=Last', context)).toBe(false);
    });
    test('should fail test if base or compare reference is not existing', () => {
        expect(isTestMatching('Gen.1:2>1:3', context)).toBe(false);
    });
    test('should correctly run the compare tests', () => {
        expect(isTestMatching('Gen.1:1>1:2', context)).toBe(true);
        expect(isTestMatching('Gen.1:1>2:1', context)).toBe(false);
        expect(isTestMatching('Gen.1:1<2:1', context)).toBe(true);
        expect(isTestMatching('Gen.1:1<1:2', context)).toBe(false);
        expect(isTestMatching('Gen.1:1*2>2:1', context)).toBe(true);
        expect(isTestMatching('Gen.1:1>1:2*2', context)).toBe(false);
    });
});
