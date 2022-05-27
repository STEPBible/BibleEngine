# @bible-engine/client

## Install

The package can be installed via yarn or npm as usual.

## Usage (local database with server fallback)

```typescript
import { BibleEngineClient } from '@bible-engine/client';

const beClient = new BibleEngineClient({
    bibleEngineConnectionOptions: {
        type: 'capacitor',
        driver: this.sqlite, // specific for the capacitor-typeorm-driver, you have to pass the sqlite driver
        journalMode: 'WAL',
        name: 'bibleEngine',
        database: `bibles_${environment.dbBiblesVersion}`,
        synchronize: false,
        logging: ['error'],
    },
    apiBaseUrl: 'https://bible-engine.example.test/api', // the URL to the BibleEngine server
});

// access data from where it's available
const bibleData = await beClient.getReferenceRange({ ... });

// access local BibleEngine directly
const localVersions = await beClient.localBibleEngine.getVersions('en');

// access server directly (you can use intellisense to get a list of all available api methods)
const remoteVersions = await beClient.remoteApi.getVersions('en');
```

## Usage (remote only)

If you only want to access BibleEngine through a server, it is enough to use the API client directly:

```typescript
import { BibleApi } from '@bible-engine/client';

const beApi = new BibleApi(apiBaseUrl);
const bibleData = await beApi.getReferenceRage({...});
```
