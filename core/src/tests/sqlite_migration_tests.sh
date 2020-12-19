set -e
# Yarn requires a modern version of Node, >8
source /opt/circleci/.nvm/nvm.sh && nvm install 14.15.3 && nvm use 14.15.3
# Run existing migrations
yarn typeorm migration:run --connection sqlite
# Check if any additional migrations are needed
yarn typeorm migration:generate -n AMissingMigration --connection sqlite
# Test if the migration was created, and if so, return with error
if ls ~/BibleEngine/core/src/migrations/sqlite/*AMissingMigration.ts 1> /dev/null 2>&1; then
    echo "Schema changes were made that arent captured by migrations, exiting with error"
    echo "Run the ./generate_migrations.sh file to create all needed migrations"
    exit 1
fi
echo "Success! Current sqlite migrations account for all schema changes."