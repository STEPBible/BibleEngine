# Changelog

## [1.4.16]

### Features

-   [usx] use `qd` (POETRY_END_NOTE) equivalent to `d` (TITLE_CANONICAL) which have basically the same meaning and formatting

### Bug Fixes

-   [dbl] ensure consistent uppercase for version abbreviations

## [1.4.15]

### Bug Fixes

-   [dbl] adjustments for slovak language
-   [usx] added `pr`, `po`, `qd`, `litl`, `lh`, and `lf` node styles

## [1.4.14]

### Bug Fixes

-   [dbl] fixed handling of different metadata structures in DBL packages
-   [usx] added `tcr1` and `cls` node style

## [1.4.13]

### Bug Fixes

-   [dbl] added chapter verse separator setting for Hausa language

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
