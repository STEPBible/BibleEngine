import { BibleEngine } from './../BibleEngine.class';

describe('getMigrations', () => {
    const bibleEngine = new BibleEngine({
        type: 'sqlite',
        database: ':memory:'
    });
    it('returns sqlite migrations for mobile databases', () => {
        expect(bibleEngine.getMigrations('sqlite').name).toBe('sqlite');
        expect(bibleEngine.getMigrations('sqlite').migrations.length).toBeGreaterThan(0);
        expect(bibleEngine.getMigrations('expo').name).toBe('sqlite');
        expect(bibleEngine.getMigrations('expo').migrations.length).toBeGreaterThan(0);
        expect(bibleEngine.getMigrations('cordova').name).toBe('sqlite');
        expect(bibleEngine.getMigrations('cordova').migrations.length).toBeGreaterThan(0);
        expect(bibleEngine.getMigrations('sqljs').name).toBe('sqlite');
    });
    it('returns postgres migrations for postgres databases', () => {
        expect(bibleEngine.getMigrations('postgres').name).toBe('postgres');
    });
    it('throws an error for unsupported databases', () => {
        expect(() => bibleEngine.getMigrations('oracle').name).toThrowError();
    });
});
