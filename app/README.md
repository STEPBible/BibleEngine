## Getting Started

We're so glad you're here! Let's change the world, together!

### Setting up your environment

1. Enable Developer mode on your phone
1. Download Android Studio
1. Connect your phone to your computer using a cable
1. Make a blank Android app
1. Run it, verify it shows up on your phone OR on an Android emulator
1. Close Android Studio
1. Open expo (expo start --android)
1. Change connection setting to "Local"
1. Change color: try ReadingView.tsx, background: backgroundColor to 'magenta'
1. Verify that the change takes < 5 seconds to load
1. On your phone or simulator, close Expo and reopen if it gets stuck on 100%
1. Celebrate 😀

### Setting up the app

Welcome! We're glad you're here. Let's change the world, together!

Install some global dependences:

```
npm install -g expo-cli
npm install -g typescript
```

Check out the repo:

```
cd ~
git clone https://github.com/tyndale/BibleEngine.git
cd BibleEngine
```

Use the mobile-friendly version of TypeORM:

```
git checkout expo-app -- core/typeorm.ts
```

Build Typescript files, and ignore any warnings or errors:

```
yarn --cwd core build || true
```

Install dependencies:

```
yarn install
```

Copy a pre-built database into the repo:

_need a database? Ask Dan Bennett for one, or build one using some instructions further below_

```
cp ~/Downloads/bible.db ~/BibleEngine/app/assets/
```

Start the app to see everything in action:

```
cd ~/BibleEngine/app
expo start
```

## Upgrading

We move quickly, and a lot can change! If you need to upgrade your repo, follow these instructions.

Reset everything to master, and remove untracked files like node_modules:

```
git checkout master
git pull origin master
git clean -xdff
```

Use the mobile-friendly version of TypeORM:

```
git checkout expo-app -- core/typeorm.ts
```

Rebuild the Typescript files:

```
yarn --cwd core build || true
```

Install dependencies:

```
yarn install
```

Start Expo to make sure everything worked:

```
cd ~/BibleEngine/app
expo start
```

## Building a Database

Want a database to run in the app? Follow these steps!

Note: for the lexicons, you'll need access to some copyrighted material that's not checked into this repo.

Build, for instance, an ESV database from a Sword module:
```
cp ~/Downloads/ESV2016_th.zip ~/BibleEngine/importers/src/osis-sword-module/data
cd ~/BibleEngine/importers/src/osis-sword-module
npx ts-node src/importer.ts
```

Import copyrighted lexicon materials:

```
mkdir -p ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/hebrew_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/greek_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
```

Add lexicon content to the database:

```
cd ~/BibleEngine/importers
npx ts-node src/step-lexicon/importer.ts
```

Inspect the resulting file, if you'd like:

```
open ~/BibleEngine/importers/output/bible.db
```

Copy the database into the app:

```
cp ~/BibleEngine/importers/output/bible.db ~/BibleEngine/app/assets/
```

Start Expo to make sure everything worked:

```
cd ~/BibleEngine/app
expo start
```
