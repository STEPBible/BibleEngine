set -e
# Yarn requires a modern version of Node, >8
source /opt/circleci/.nvm/nvm.sh && nvm install 13.5.0 && nvm use 13.5.0
# Start postgres docker container and wipe any persisted data
docker-compose up -d --build --force-recreate --renew-anon-volumes postgres-db
# Wait until postgres container can accept requests
until [ "$(docker inspect -f='{{.State.Health.Status}}' $(docker ps -q))" = "healthy" ]; do
    sleep 0.1
done;
# Run existing migrations
yarn typeorm migration:run --connection postgres
# Check if any additional migrations are needed
yarn typeorm migration:generate -n AMissingMigration --connection postgres
# Stop all open containers
docker stop $(docker ps -q)
# Test if the migration was created, and if so, return with error
if ls ~/BibleEngine/core/src/migrations/postgres/*AMissingMigration.ts 1> /dev/null 2>&1; then
    echo "Schema changes were made that arent captured by migrations, exiting with error"
    echo "Run the ./generate_migrations.sh file to create all needed migrations"
    exit 1
fi
echo "Success! Current postgres migrations account for all schema changes."