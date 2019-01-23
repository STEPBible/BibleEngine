# Adding new group types to BibleEngine

Currently, adding new types for `IContentGroup` involves a few steps. Possibly a future refactoring will make this more straightforward.

## `models/ContentGroup`

add the type identifier to `ContentGroupTypes`

If the type needs a modifier that is not compatible with `IContentGroup['modifier']`, update it accordingly using [conditional types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html).

If the type is just an "on/off" thing, you can ignore this.

## `models/BiblePhrase.ts`

If the type needs a modifier, add it to `ValueModifiers`, otherwise (if it's only either on or off) to `BooleanModifiers`.

Add the type as an optional property to `PhraseModifiers` with the appropriate modifier type (`boolean` if no modifier).

You may notice that there is no straightforward relation between `ContentGroupTypes` and `PhraseModifiers`. This is mainly due to the difference between the input and output format of `BibleEngine` and the database schema. `IBiblePhraseWithNumbers` and `PhraseModifiers` is what represents the database format (cf. `entities/BiblePhrase.entity.ts`). `IContentGroup<ContentGroupTypes>` and everything extending from it it represents what `BibleEngine` takes for input and returns for output. The latter is a hierarchical format, the former a relational (thus the need to represent hierarchical information separately).

## `entities/BiblePhrase.entity.ts`

If the new type has a modifier, the method `getModifierValue()` needs to be updated to return `undefined` for this type.

## `BibleEngine.class.ts` > `addBibleContent()` (Input)

The new type needs to be taken care of while constructing the `childState` before the recursive call to `addBibleContent()`.

## `functions/content.functions.ts` > `generateBibleDocument()` (Output)

The method makes to walks two times through the document in its current state, one time to determine if a phrase is still within the current `activeGroup` and after that to determine the current `activeModifiers` for a phrase. If the new type has a modifier, it needs to be checked for in both occasions.

Finally, the new type needs to be added to the `modifiers` array. The order of the types here determines, which types become outer and inner groups in case they start at the exact same phrase. Groups that usually only span over one words should come after ones that usually span over a group of words which should after those that span over sentences or paragraphs.

When a type is not added to `modifiers` at all, it will be ignored in the output.
