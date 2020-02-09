set -e
# Yarn requires a modern version of Node, >8
source /opt/circleci/.nvm/nvm.sh && nvm install 13.5.0 && nvm use 13.5.0
# Start mysql docker container and wipe any persisted data
docker-compose up -d --build --force-recreate --renew-anon-volumes mysql-db
# Wait until mysql container can accept requests
until [ "$(docker inspect -f='{{.State.Health.Status}}' $(docker ps -q))" = "healthy" ]; do
    sleep 0.1
done
# Run existing migrations
yarn typeorm migration:run --connection mysql
# Check if any additional migrations are needed
yarn typeorm migration:generate -n AMissingMigration --connection mysql
# Stop all open containers
docker stop $(docker ps -q)
# Test if the migration was created, and if so, return with error
if ls ~/BibleEngine/core/src/migrations/mysql/*AMissingMigration.ts 1> /dev/null 2>&1; then
    echo "Schema changes were made that arent captured by migrations, exiting with error"
    echo "Run the ./generate_migrations.sh file to create all needed migrations"
    exit 1
fi
echo "Success! Current mysql migrations account for all schema changes."