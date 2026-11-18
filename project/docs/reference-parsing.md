# Automatic reference matching

OSIS, USX, and optional custom metadata in the HTML importer add book aliases to
Bible Passage Reference Parser (BCV). The language module still owns boundary
rules, grammar, verse interpretation, translation labels, and Unicode handling.
Do not replace those boundaries with ASCII word boundaries or require spaces:
compact references and multiple writing systems depend on the existing behavior.

Custom metadata supplies exact titles and abbreviations. An abbreviation's trailing
period is optional and must be escaped through both JavaScript and RegExp parsing.
Some source conventions also extend the metadata abbreviation by one Unicode letter
or combining mark. That compatibility form is registered after exact custom and
built-in patterns. It does not consume a digit, whitespace, or arbitrary punctuation.
Consequently, a one-letter extension can still match even if it is not itself in
metadata; this is deliberate compatibility, not unrestricted fuzzy matching.

BCV normally consumes book patterns in registration order. Sorting books by their
number or longest title cannot resolve all overlaps: one book can have both long
and short aliases, and custom aliases compete with built-in ones. The adapter in
`importers/src/shared/preferLongerBookAliases.ts` compares actual boundary-valid
matches. Longer overlapping spans win; equal spans retain registration priority.
It then delegates tokenization to BCV using the selected spans, preserving original
text offsets and translation processing. It restores the configured patterns after
each call, including failures.

The adapter uses BCV 3.1's internal `matcher.match_books` and `regexps.books` boundary,
which is not covered by the library's public TypeScript interface. Keep that coupling
isolated. When upgrading BCV, run `yarn test:references` and repeat the corpus check
below; a successful TypeScript build alone does not verify this integration.

## Comparing against source conventions

Use the real importer metadata/options with an in-memory sink for `addVersion`,
`addBookWithContent`, and `finalizeVersion`; never invoke database creation or read
connection secrets. Capture calls to `getReferencesFromText`, including parser
configuration, text, book/chapter context, and invalid-reference policy. First verify
that replaying the unchanged parser reproduces the baseline exactly. Compare the
candidate's OSIS ranges and text offsets as well as parser exceptions. Check all
removed links and changed targets in their original context.

Separate previously unparseable source fragments from regressions. If an audit-only
exception handler allows traversal to continue, record those fragments and verify
that the candidate does not add failures; do not describe that as a fully successful
production import. Run the final importer path as well as replayed calls.

Keep licensed text, external metadata, private paths, and raw comparison captures
outside the repository. Commit synthetic regression cases for the discovered
conventions. Parser changes affect future imports; existing database notes need
an explicitly authorized reimport or targeted repair.

## Interpretation limits exposed by the audit

Link conversion uses the first resolved OSIS endpoint to distinguish a verse
reference (`Phlm.1.24`) from a chapter-only reference (`John.3`). BCV's syntax type
can still be `bc` for a resolved single-chapter verse; its start/end verse fields
are also populated for chapter-only references. Neither is sufficient on its own.
Verse and chapter numbers still come from the parsed start/end objects. Invalid
references without an OSIS value retain the existing syntax-based conversion.

A list shaped like `Ps 42:1–11, 44, 45` is still interpreted as verses 44 and 45 of
Psalm 42. Its intended meaning depends on source conventions and prose context;
this change does not infer chapters or alter punctuation/sequence handling.
