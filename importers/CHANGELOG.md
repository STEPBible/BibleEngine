# Changelog

## [1.3.6]

### Features

-   [osis] added option to ignore empty section titles

## [1.2.3]

### Features

-   added cross reference detection for notes to OSIS importer

## [1.2.0]

### Bug Fixes

-   added fixes to subverse handling in v11n data (importing existing fixes from stepdata)
-   fixed wrong default log-level for Logger

### Features

-   added importer for DBL packages
-   added importer for USX format
-   moved reference parsing to `shared` so that all importers can use the same code
-   added parsing of cross references from text to OSIS importer
-   added non-latin characters to `phrase.skipSpace` handling

### Chores

-   migrated to typescript strict index access
