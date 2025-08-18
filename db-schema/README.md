## running migrations on testing / live server

- the migration code is build locally and then uploaded to the server via `npm run deploy`
- after that login to eu-1 and cd into the `migrations` folder
- run either `npm run prod-live` or `npm run prod-testing` to run the migrations on the server