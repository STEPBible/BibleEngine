# Architecture and local verification

| Package | Responsibility |
| --- | --- |
| `db-schema` | Kysely schema types and migration provider (MySQL/SQLite) |
| `core` | Database access, verse normalization, references, document models |
| `importers` | OSIS, USX, SWORD and other source adapters; database/file creation |
| `server` | Koa API and generated client contract |
| `client` | Database/server access and remote fallback |

The root package is private. The five workspaces are released together. Database
construction uses Kysely; do not reintroduce TypeORM connection options or entities.
Preserve verse IDs, versification rules, document ordering, and existing database
contracts. Review both MySQL and SQLite paths before changing database behavior.
Do not regenerate `db-schema/generated/db.d.ts` from an unknown database.

Use Node.js 22+ and Yarn 1.22.x. `yarn install --frozen-lockfile` installs dependencies.
`yarn buildAll` builds schema, core, importers, regenerates `client/src/Bible.api.ts`
from server controllers, then builds server and client. Edit the generator or API
contract, not the generated client. `lib/` is generated and ignored.

Packages ship ESM. Relative imports include `.js`; JSON module imports require the
JSON import attribute. Verify package entry points in plain Node, not only through
TypeScript or a development loader. Package `files` allowlists limit npm contents.

The legacy Jest 24 / ts-jest 24 suite predates the ESM migration and currently fails
at config loading (`module is not defined`). Do not present it as a green suite.
New focused regressions can use Node's built-in test runner against compiled output;
record their commands and build dependencies. `yarn test:references` builds the
required packages and runs the automatic-reference regressions. Modernizing the legacy suite is a
separate effort. The existing CircleCI Node 14 configuration is also historical,
not evidence of compatibility with current dependencies.
