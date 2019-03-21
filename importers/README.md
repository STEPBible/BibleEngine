## Usage Database Creator

```typescript
import {
    BeDatabaseCreator,
    V11nImporter,
    NeueImporter,
    SwordImporter
} from '@bible-engine/importers';

const creator = new BeDatabaseCreator({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'bibleengine',
    password: 'bibleengine',
    database: 'bibleengine',
    dropSchema: true
});

creator.addImporter(V11nImporter);
creator.addImporter(SwordImporter, '../data/ESV2016_th.zip');
creator.addImporter(NeueImporter);

creator.createDatabase();
```
