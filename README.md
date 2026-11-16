# BibleEngine

## About BibleEngine

_BibleEngine_ can serve as a general purpose library for powering JavaScript bible projects. In it's core, the project makes use of the [excellent datasets of Tyndale House](https://stepbible.github.io/STEPBible-Data/) to provide features like:

-   automatic versification conversion across any bible version
-   integrated up-to-date original language text with variants for all text forms
-   automatic morphology for any bible version with strongs
-   automatic source text matching (verse level), even for bibles _without_ strongs
-   integrated glosses for each original word, plus lemma, transliteration and Strong/BDB entries

Additional features:

-   offline-first design with remote fallback
-   database access through [Kysely](https://kysely.dev), with MySQL and SQLite schema support
-   performant and space-efficient database design, focussed on bible study use cases
-   [plugin system](https://github.com/STEPBible/BibleEngine/tree/master/importers) to import any kind of bible format
-   TypeScript - Intellisense for the win!

## Packages

-   [@bible-engine/core](https://github.com/STEPBible/BibleEngine/tree/master/core): the brain of _BibleEngine_
-   [@bible-engine/client](https://github.com/STEPBible/BibleEngine/tree/master/client): client for reading from a _BibleEngine_ database or server
-   [@bible-engine/importers](https://github.com/STEPBible/BibleEngine/tree/master/importers): for creating a _BibleEngine_ database and import data from different data sources
-   [@bible-engine/server](https://github.com/STEPBible/BibleEngine/tree/master/server): implementation example for a _BibleEngine_ server

## Version 2

Version 2 replaces TypeORM with Kysely and ships ESM packages targeting ES2020.
Pass a Kysely database instance to `BibleEngine` instead of TypeORM connection options.
Use matching versions of the workspace packages. Schema migrations and generated database
interfaces now live in `@bible-engine/db-schema`.

## Contributing

Use Node.js 22 or newer and Yarn Classic (1.22.x). From the repository root:

```sh
yarn install --frozen-lockfile
yarn buildAll
```

The build runs schema → core → importers → API client generation → server → client.
See [db-schema](db-schema) for migration entry points.
