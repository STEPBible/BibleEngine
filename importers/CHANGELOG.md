# Changelog

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
