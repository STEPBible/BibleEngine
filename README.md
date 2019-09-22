# BibleEngine

[![CircleCI](https://circleci.com/gh/tyndale/BibleEngine.svg?style=svg)](https://circleci.com/gh/tyndale/BibleEngine)

**THIS IS A WORK IN PROGRESS** - don't use it in any kind of production code yet. Things will break.

Having said that: Good you are here! Have a look at our [Project board](https://github.com/tyndale/BibleEngine/projects/1) to get an impression whats going on right now. Contributions welcome!

## About BibleEngine

_BibleEngine_ can serve as a general purpose library for powering JavaScript bible projects. In it's core, the project makes use of the [excellent datasets of Tyndale House](https://tyndale.github.io/STEPBible-Data/) to provide features like:

-   automatic versification conversion across any bible version
-   integrated up-to-date original language text with variants for all text forms
-   automatic morphology for any bible version with strongs
-   automatic source text matching (verse level), even for bibles _without_ strongs
-   integrated glosses for each original word, plus lemma, transliteration and Strong/BDB entries

Additional features:

-   offline-first design with remote fallback
-   compatible with (almost) all relational databases (via [TypeORM](http://typeorm.io))
-   performant and space-efficient database design, focussed on bible study use cases
-   [plugin system](https://github.com/tyndale/BibleEngine/tree/master/importers) to import any kind of bible format
-   TypeScript - Intellisense for the win!

## Packages

-   [@bible-engine/core](https://github.com/tyndale/BibleEngine/tree/master/core): the brain of _BibleEngine_
-   [@bible-engine/importers](https://github.com/tyndale/BibleEngine/tree/master/importers): importers for different data sources
-   [@bible-engine/server](https://github.com/tyndale/BibleEngine/tree/master/server): implementation example for a remote fallback server
-   [@bible-engine/app](https://github.com/tyndale/BibleEngine/tree/master/app): react-native app
