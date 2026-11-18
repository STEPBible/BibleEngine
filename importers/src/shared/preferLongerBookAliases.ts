import { BibleReferenceParser } from '@bible-engine/core';
import { escapeRegExp } from './helpers.functions.js';

type BookPattern = { regexp: RegExp; osis: string[]; extra?: string };
type BookMatch = {
    start: number;
    end: number;
    full: string;
    name: string;
    pattern: BookPattern;
    priority: number;
};

// BCV 3.1 exposes no public overlap-resolution hook. Keep this narrow adapter at
// the book-tokenization boundary; grammar, translations, offsets, and language
// boundaries remain owned by BCV. Exercise it when upgrading that dependency.
interface ParserWithMatcher {
    regexps: { books: BookPattern[] };
    matcher: { match_books: (text: string) => unknown };
}

const configured = new WeakSet<object>();

/** Prefer complete book aliases over contained aliases, including built-in names. */
export function preferLongerBookAliases(parser: BibleReferenceParser) {
    if (configured.has(parser)) return;
    const internal = parser as unknown as ParserWithMatcher;
    const original = internal.matcher.match_books;
    internal.matcher.match_books = function (text) {
        const patterns = internal.regexps.books;
        const matches: BookMatch[] = [];
        for (const [priority, pattern] of patterns.entries()) {
            pattern.regexp.lastIndex = 0;
            for (const match of text.matchAll(pattern.regexp)) {
                matches.push({
                    start: match.index!,
                    end: match.index! + match[0].length,
                    full: match[0],
                    name: match[1]!,
                    pattern,
                    priority,
                });
            }
        }
        matches.sort(
            (a, b) => b.full.length - a.full.length || a.priority - b.priority || a.start - b.start
        );
        const selected: BookMatch[] = [];
        let overlaps = false;
        for (const match of matches) {
            const existing = selected.find(
                (other) => other.start < match.end && match.start < other.end
            );
            if (!existing) selected.push(match);
            else if (existing.start !== match.start || existing.end !== match.end) overlaps = true;
        }
        if (!overlaps) return original.call(this, text);

        // Process the selected spans left to right. Anchoring each match to the
        // untouched suffix keeps its position stable as BCV replaces earlier
        // names with tokens of different lengths. Equal-length matches retain
        // BCV's configured priority (including explicit metadata overrides).
        selected.sort((a, b) => a.start - b.start);
        internal.regexps.books = selected.map(({ full, name, end, pattern }) => {
            const offset = full.indexOf(name);
            return {
                ...pattern,
                regexp: new RegExp(
                    `${escapeRegExp(full.slice(0, offset))}(${escapeRegExp(name)})` +
                        `${escapeRegExp(full.slice(offset + name.length))}` +
                        `(?=[\\s\\S]{${text.length - end}}$)`,
                    'g'
                ),
            };
        });
        try {
            return original.call(this, text);
        } finally {
            internal.regexps.books = patterns;
        }
    };
    configured.add(parser);
}
