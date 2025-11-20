# Changelog for BibleEngine Client

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
