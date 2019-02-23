# BibleEngine

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

## Getting Started

### Setting up the app

Install some global dependences:

```
npm install -g expo-cli
npm install -g typescript
```

Check out the repo and build all dependencies:

```
git clone https://github.com/tyndale/BibleEngine.git
cd BibleEngine
yarn --cwd core build
yarn install
```

Start the app to see everything in action:

```
cd app
expo start
```

## Upgrading

Reset everything to master, and remove untracked files like node_modules:

```
git checkout master
git pull origin master
git clean -xdff
```

Rebuild the Typescript files:

```
yarn --cwd core build
```

Reinstall the packages:

```
yarn install
```

Start Expo to make sure everything worked:

```
cd app
expo start
```

## Building database for app

Note: you'll need access to some copyrighted material that's not checked into this repo.

Copy some copyrighted material into the repo:

```
cp ~/Downloads/hebrew_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/greek_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/ESV2016_th.zip ~/BibleEngine/importers/src/osis-sword-module/data
```

Build the ESV from a Sword module:
```
cp ~/Downloads/ESV2016_th.zip ~/BibleEngine/importers/src/osis-sword-module/data
cd ~/BibleEngine/importers/src/osis-sword-module
npx ts-node src/importer.ts
```

Add the lexicon entries:

```
cd ~/BibleEngine/importers
npx ts-node src/step-lexicon/importer.ts
open ~/BibleEngine/importers/output/bible.db
```

Copy the database into the app:

```
cp ~/BibleEngine/importers/output/bible.db ~/BibleEngine/app/assets/
```

## Packages

-   [@bible-engine/core](https://github.com/tyndale/BibleEngine/tree/master/core): the brain of _BibleEngine_
-   [@bible-engine/importers](https://github.com/tyndale/BibleEngine/tree/master/importers): importers for different data sources
-   [@bible-engine/server](https://github.com/tyndale/BibleEngine/tree/master/server): implementation example for a remote fallback server
-   [@bible-engine/app](https://github.com/tyndale/BibleEngine/tree/master/app): react-native app
