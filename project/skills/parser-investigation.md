# Parser investigation

1. Trace source text → importer options/book metadata → reference parser → document
   phrases/ranges → database write. Check whether a reference is explicit in the
   source or automatically detected in free text.
2. Reproduce with the real options and a minimal synthetic fixture. If a licensed
   source is available locally, inspect it read-only and keep it outside Git.
3. Assert the target OSIS book, chapter/verse, complete matched text and offsets.
   Numbered books, abbreviations, punctuation, case, and mixed formatting matter.
4. Fix the shared boundary responsible for the defect. Avoid translation-specific
   string replacements or rewriting source text to hide a parser error.
5. Demonstrate failure before and success after. Exercise neighboring unnumbered
   and numbered books and the importer path, not only a standalone regex.
6. Explain the data lifecycle: parser fixes affect future imports; existing stored
   notes require reimport or an explicitly authorized targeted data repair.
