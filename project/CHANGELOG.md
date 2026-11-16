# Project changelog

## 2.0.1 — 2026-11-16

- Fixed numbered custom book alias precedence in automatic note references.
  Eight regression tests pass, including OSIS mixed-format notes; the original
  reported source verse was verified read-only without retaining its content.
- Verified the full build, package file lists, and all five ESM entry points.
  The same eight regressions pass against packed artifacts in an isolated install.
- Added `yarn test:references` to build and run the focused Node test suite.
- Removed obsolete local import scripts coupled to external checkout paths.
- Added public-repository agent guidance, architecture notes, parser investigation,
  and release workflows. Documented the legacy test/CI limitations.

## 2.0.0 — 2026-11-16

- Promoted the Kysely/ESM refactor to master with synchronized stable package versions.
- Completed native ESM imports, JSON loading, and API client generation.
- Restricted published package contents and replaced obsolete setup instructions.
- Verified the full build and all five package entry points in Node.js.
