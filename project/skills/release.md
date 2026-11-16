# Release workflow

1. Inspect the branch, worktree, remote and existing tags. Fetch before integrating;
   never overwrite remote history. Keep release work separate from bug fixes.
2. Align root/workspace versions and exact internal dependency pins. Update package
   changelogs and `project/CHANGELOG.md`. Refresh Yarn links/lockfile as needed.
3. Run `yarn buildAll`, targeted regression tests, and native Node imports of all
   five package entry points. Report legacy suite limitations explicitly.
4. Run `npm pack --workspaces --dry-run --ignore-scripts --json`. Inspect each
   file list for entry points, declarations, data assets, and accidental private
   files. For a release, pack and smoke-test the resulting artifacts outside the
   checkout as well. Never publish credentials or licensed Bible datasets.
5. Review the exact diff, commit, and create an annotated `vX.Y.Z` tag. A local
   baseline tag does not authorize pushing or publishing it.
6. Only after authorization and verification, push master and the intended tags.
   Check npm authentication and version availability. Publish in dependency order:
   db-schema, core, importers, server, client. Use public access and verify registry
   versions afterward. Never republish an existing version or silently substitute
   a different version if publication fails. Partial publication must be reported.

Use `--cache /tmp/bibleengine-npm-cache` for npm inspection when the default cache
is unavailable. Do not store tokens in this repository. Authentication/OTP is a
local user action; ask for it when needed without requesting secrets in chat.
