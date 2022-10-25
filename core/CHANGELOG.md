# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.3.3]

### Bug Fixes

-   fixed handling of spaces when merging phrases in `skipStrongs` mode

## [1.3.1]

### Features

-   added `crossRefBeforePhrase` attribute to `BibleVersionEntity`

## [1.2.3]

### Bug Fixes

-   paragraph handling is now more solid in edge cases when querying
-   line groups are now properly restarted if the line number resets
-   prevent error when a version has chapters that don't exist in normalized v11n
-   fixed wrong results when comparing phraseIds by version numbering

## [1.2.0]

### Bug Fixes

-   get correct chapter verse count when verse are not in order in source file
-   save section subtitles
-   increase length of language-code in `BibleVersionEntity` to 15
-   added fixes to subverse handling

### Features

-   added `isChapterLabel` property to bible sections (so that chapter numbers can be ignored when rendering)

### Chores

-   migrated to typescript strict index access

## [1.1.0](https://github.com/STEPBible/BibleEngine/compare/v1.0.3...v1.1.0) (2022-06-27)

Migrated to TypeORM 0.3

## [1.0.3](https://github.com/STEPBible/BibleEngine/compare/v1.0.2...v1.0.3) (2022-06-24)

### Bug Fixes

-   column length of BibleBook.osisId reduced to 100, otherwise composed index on the table is too long for that table in mysql

### Chores

-   cleaned up old documentation and added some new examples to packages README
-   published `client` and `importers` packages to npm
-   updated version numbers and peerDependencies to reflect the now published 1.0.x npm packages

## 1.0.2 (2022-05-24)

### Bug Fixes

-   fixed failing tests and inconsistent typing for subverse handling in v11n ([ff06953](https://github.com/STEPBible/BibleEngine/commit/ff06953ac01c8b71a8c9f60cd804f483a9240e21))

## 1.0.1 (2022-02-04)

### Added

-   Support custom connection name overrides

## 1.0.0 (2022-01-20)

### Changed

-   Update dictionary_entry.content to be string type
