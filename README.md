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
-   compatible with (almost) all relational databases (via [TypeORM](http://typeorm.io))
-   performant and space-efficient database design, focussed on bible study use cases
-   [plugin system](https://github.com/STEPBible/BibleEngine/tree/master/importers) to import any kind of bible format
-   TypeScript - Intellisense for the win!

## Packages

-   [@bible-engine/core](https://github.com/STEPBible/BibleEngine/tree/master/core): the brain of _BibleEngine_
-   [@bible-engine/client](https://github.com/STEPBible/BibleEngine/tree/master/client): client for reading from a _BibleEngine_ database or server
-   [@bible-engine/importers](https://github.com/STEPBible/BibleEngine/tree/master/importers): for creating a _BibleEngine_ database and import data from different data sources
-   [@bible-engine/server](https://github.com/STEPBible/BibleEngine/tree/master/server): implementation example for a _BibleEngine_ server
-   [@bible-engine/app](https://github.com/STEPBible/BibleEngine/tree/master/app): react-native app

## Contributing

To set up a local database for testing, install docker-compose and run:

```
docker-compose up postgres-db
```

Install all packages:

```
yarn install
```

To generate a new migration to capture schema changes:

```
yarn typeorm migration:generate -n SomeMigrationName
```

To test a new migration, run:

```
yarn typeorm migration:run
```
