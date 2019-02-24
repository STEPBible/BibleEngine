# Build the database needed for the Expo App
set -x
set -e

cd ~/BibleEngine

# Use the mobile-friendly version of TypeORM
git checkout expo-app -- core/typeorm.ts

# Build Typescript files
yarn --cwd core build || true

# Install dependencies
yarn install

# Import copyrighted materials
mkdir -p ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/hebrew_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/greek_lexicon.txt ~/BibleEngine/importers/src/step-lexicon/data/
cp ~/Downloads/ESV2016_th.zip ~/BibleEngine/importers/src/osis-sword-module/data

# Add the ESV to the database file
cd ~/BibleEngine/importers/src/osis-sword-module
yarn install
npx ts-node src/importer.ts

# Add lexicon entries to the database file
cd ~/BibleEngine/importers
npx ts-node src/step-lexicon/importer.ts

# Copy the database into the app
cp ~/BibleEngine/importers/output/bible.db ~/BibleEngine/app/assets/

# Inspect the db
open ~/BibleEngine/importers/output/bible.db

cp ~/Desktop/bible.db ~/BibleEngine/app/assets

# Open Expo and make sure it works
cd ~/BibleEngine/app
expo start -c
