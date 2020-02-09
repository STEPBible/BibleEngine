if [ $# -ne 1 ]; then
    echo $0: usage: ./generate_all_driver_migrations YourMigrationName
    exit 1
fi

docker-compose up -d mysql-db postgres-db

until [ "$(docker inspect -f='{{.State.Health.Status}}' bibleengine_mysql)" = "healthy" ]; do
    sleep 0.1
done
until [ "$(docker inspect -f='{{.State.Health.Status}}' bibleengine_postgres)" = "healthy" ]; do
    sleep 0.1
done

yarn typeorm migration:run --connection mysql
yarn typeorm migration:run --connection postgres
yarn typeorm migration:run --connection sqlite

yarn typeorm migration:generate -n $1 --connection mysql
yarn typeorm migration:generate -n $1 --connection postgres
yarn typeorm migration:generate -n $1 --connection sqlite