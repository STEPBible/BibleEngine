# Changelog for BibleEngine Server

## [1.4.6]

### Features

-   added option to pass list of secondary languages as query parameter to `syncVersions` endpoint

## [1.4.0]

### Features

-   added fts search endpoint
-   added optional query parameters to `/ref/:versionUid/:osisId/:chapterNr/:verseNr` route to allow for verse ranges

### Bug Fixes

-   removed non-working `/ref/:versionUid/:osisId/:chapterNr/:verseNr-:verseEndNr` route and merged it with `/ref/:versionUid/:osisId/:chapterNr/:verseNr`
