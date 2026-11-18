# Changelog for BibleEngine Server

## 2.0.2 (2026-11-18)

- Align workspace versions and dependencies with the 2.0.2 reference parsing fixes.

## 2.0.1 (2026-11-16)

- Align workspace package versions and dependencies with the 2.0.1 importer fix.

## 2.0.0 (2026-11-16)

- Promote the production-used Kysely/ESM refactor to a stable release.
- Align internal package dependencies with the stable 2.0.0 release.
- Complete native ESM entry points and restrict published files to build artifacts.

## [2.0.0]

### Breaking Changes

-   migrated from typeorm to kysely, constructor parameters have changed

## [1.4.6]

### Features

-   added option to pass list of secondary languages as query parameter to `syncVersions` endpoint

## [1.4.0]

### Features

-   added fts search endpoint
-   added optional query parameters to `/ref/:versionUid/:osisId/:chapterNr/:verseNr` route to allow for verse ranges

### Bug Fixes

-   removed non-working `/ref/:versionUid/:osisId/:chapterNr/:verseNr-:verseEndNr` route and merged it with `/ref/:versionUid/:osisId/:chapterNr/:verseNr`
