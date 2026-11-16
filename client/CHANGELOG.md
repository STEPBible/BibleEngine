# Changelog for BibleEngine Client

## 2.0.1 (2026-11-16)

- Align workspace package versions and dependencies with the 2.0.1 importer fix.

## 2.0.0 (2026-11-16)

- Promote the production-used Kysely/ESM refactor to a stable release.
- Align internal package dependencies with the stable 2.0.0 release.
- Complete native ESM entry points and restrict published files to build artifacts.

## [2.0.0]

### Bug Fixes

-   properly configured project to use ESM

### Breaking Changes

-   migrated from typeorm to kysely, constructor parameters have changed

### Features

-   added optional parameter `secondaryLangs` to `syncVersions`

## [1.4.0]

### Features

-   added search method
-   refactored `getFullDataForReferenceRange` to use GET requests whenever possible to enable caching
