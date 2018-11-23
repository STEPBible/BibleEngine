# BibleEngine

**THIS IS A WORK IN PROGRESS** - don't use it in any kind of production code yet. Things will break.

Having said that: Good you are here! Have a look at our [Project board](https://github.com/tyndale/BibleEngine/projects/1) to get an impression whats going on right now. Contributions welcome!

## About BibleEngine

_BibleEngine_ can serve as a general purpose library for powering JavaScript bible projects. In it's core, the project makes use of the [excellent datasets of Tyndale House](https://tyndale.github.io/STEPBible-Data/) to provide features like:

-   automatic versification conversion across any bible version
-   integrated up-to-date original language text with variants for all text forms
-   automatic morphology for any bible version with strongs
-   integrated glosses for each original word, plus lemma, transliteration and Strong/BDB entries

Additional features:

-   offline-first design with remote fallback
-   compatible with (almost) all relational databases (via [TypeORM](http://typeorm.io))
-   performant and space-efficient database design, focussed on bible study use cases
-   [plugin system](./tree/master/core/plugins) to import any kind of bible format
-   TypeScript - Intellisense for the win!

## Packages

-   [@bible-engine/core](./tree/master/core): the brain of _BibleEngine_
-   [@bible-engine/server](./tree/master/server): gql-server to serve data if not present on the client
-   [@bible-engine/app](./tree/master/app): react-native app
