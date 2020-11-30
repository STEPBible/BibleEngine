import { BeDatabaseCreator } from '@bible-engine/importers';
import { SwordImporter } from '../src/importer';

describe('Sword OSIS parsing', () => {
    it(`converts the entire ESV sword module into the BibleEngine format`, async (done) => {
        try {
            const creator = new BeDatabaseCreator({
                type: 'sqlite',
                database: ':memory:'
            });
            creator.addImporter(SwordImporter as any, {
                sourcePath: 'src/bible/sword/data/ESV2016_th.zip'
            });
            await creator.createDatabase();
            done()
        } catch (error) {
            fail(error)
        }
    }, 100000)
})
