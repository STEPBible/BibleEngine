# Contributing

We're so glad you're here! Let's change the world, together!

## Setting Up Your Phone

### Setting Up iPhone

1. Enable Developer mode on your phone
2. Search "Expo" on the App Store of your phone, and download the first result. This app will allow you to preview changes as you develop.
3. Search "TestFlight" and install the first result

### Setting Up Android

1. Enable Developer mode on your phone
2. Search "Expo" on the App Store of your phone, and download the first result. This app will allow you to preview changes as you develop.

## Setting Up Your Computer

### Setting Up Windows

1. Install WSL for Windows, and choose Ubuntu as your OS
1. Download Android Studio
1. If you have an Android phone: Connect your phone to your computer using a cable
1. Make a blank Android app
1. Run it, verify it shows up on your phone OR alternatively, an an Android emulator
1. Close Android Studio
1. Install Visual Studio Code- it has helpful built-in features for working with Typescript

### Setting Up Mac

1. Download Xcode
1. Download Android Studio
1. If you have an Android phone: Connect your phone to your computer using a cable
1. Make a blank Android app
1. Run it, verify it shows up on your phone OR alternatively, an an Android emulator
1. Close Android Studio
1. Install Visual Studio Code- it has helpful built-in features for working with Typescript

## Setting Up Step Bible

Check that Node.js is installed:

```
node --version
```

Check if Yarn is installed:

```
yarn --version
```

Install Yarn if needed: https://yarnpkg.com/lang/en/docs/install

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

Build Typescript files, and ignore any warnings or errors:

```
yarn --cwd core build
```

Install dependencies:

```
cd ~/BibleEngine
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

Change the Connection mode to "Tunnel". This allows you to run the app on your phone, even if your phone is on a different network.

For Android, scan the QR code on your phone, or for iOS, have it text a link to you.

1. Change color: try ReadingView.tsx, background: backgroundColor to 'magenta'
1. Verify that the change takes < 5 seconds to load
1. On your phone or simulator, close Expo and reopen if it gets stuck on 100%
1. Celebrate 😀

## Upgrading

We move quickly, and a lot can change! If you need to upgrade your repo, follow these instructions.

Reset everything to master, and remove untracked files like node_modules:

```
git checkout master
git pull origin master
git clean -xdff
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
