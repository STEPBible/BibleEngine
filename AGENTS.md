# BibleEngine agent instructions

## Start here

BibleEngine is a public TypeScript/Yarn Classic monorepo for importing, storing,
normalizing, and serving Bible data. Read `project/docs/architecture.md` when new
or when changing a package boundary. Check Git status, the current branch, and
`project/CHANGELOG.md` before editing. Preserve existing developer changes.

Be direct, question dubious assumptions, and distinguish evidence from guesses.
Carry out clear requests; ask for missing decisions or access when truly blocked.
Keep work on the current suitable branch unless the task requires another one.

## Working rules

- Make one coherent change at a time. Keep refactors, behavior changes, release
  preparation, and documentation separable; avoid unrelated cleanup.
- Preserve published contracts, stored data, and consumer integration behavior.
  Prefer changes that existing consumers can adopt without application rewrites.
  Treat all consumers as external: never assume a particular checkout or service.
- This repository and its artifacts are public. Never copy private project names,
  paths, architecture, credentials, operational details, or licensed source data
  into code, fixtures, documentation, commit messages, or published packages.
  Use minimal synthetic fixtures. Inspect permitted external sources read-only.
- Explain non-obvious contracts and fragile logic in comments; do not narrate syntax.
- Never run imports, migrations, or destructive operations against a shared database
  without explicit authorization for that database and operation. Prefer isolated
  local fixtures. Existing released migrations are immutable.
- Use Yarn Classic and the existing lockfile. Keep workspace versions aligned for
  releases. ESM relative imports need `.js` suffixes, including directory indexes.
- Review the complete diff for requirements, edge cases, compatibility, privacy,
  and unintended changes. Build affected packages and test the actual behavior.
  Report checks that failed or could not run; do not claim unrun checks passed.
- Update durable project knowledge when behavior or workflows change. Summarize
  completed work in `project/CHANGELOG.md`. Commit coherent completed changes when
  requested or part of an authorized release. Push/publish only when authorized.

## Triggered references

| Before | Read |
| --- | --- |
| Investigating a parser/import bug | `project/skills/parser-investigation.md` |
| Changing package boundaries, public API, or database code | `project/docs/architecture.md` |
| Preparing, tagging, pushing, or publishing a release | `project/skills/release.md` |

Keep guidance small and based on verified repository behavior. Add a reference only
when its trigger is concrete; do not introduce a parallel documentation system.
