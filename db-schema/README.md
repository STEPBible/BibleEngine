# @bible-engine/db-schema

Kysely database interfaces and migrations for BibleEngine. MySQL and SQLite are
handled by the migration provider exported from `index.ts`.

Build with `yarn workspace @bible-engine/db-schema build`. Applications can use the
exported `beMigrationProvider` with Kysely's `Migrator`. The local MySQL CLI is
`yarn workspace @bible-engine/db-schema migrate --help`; inspect its options and
explicitly select the intended database before running a migration.

`generated/db.d.ts` is the committed database contract. Regeneration uses the root
`.env` via `yarn genDbTypes`; do not run it against an unspecified database or commit
credentials. Never modify an already released migration to implement a new change.
