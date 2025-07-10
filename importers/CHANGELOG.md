# Changelog

## [1.4.12]

### Features

-   [usx] added support for `s`, `x`, `xo`, `fig` node style 

## [1.4.11]

### Features

-   [usx] added support for `tcr3` node style (TABLE_CELL3_RIGHT)

### Chores

-   bumped `better-sqlite3` to `11.7.0`

## [1.4.6]

### Bug Fixes

-   [osis] force version title if passed via version metadata
-   [osis] fixed auto-closing condition of paragraphs after chapters to be consistent with auto-opening

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
