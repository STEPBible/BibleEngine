import { BeImportFileCreator } from './../src/BeImportFileCreator.class';

const run = async () => {
    const creator = new BeImportFileCreator(
        {
            type: 'sqlite',
            database: 'bibles.db',
            synchronize: false
        },
        './preload/bibles'
    );
    await creator.createAllVersions({ skipCompression: true });
};

run();
