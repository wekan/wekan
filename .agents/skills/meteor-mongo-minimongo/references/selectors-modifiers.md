# Selectors, modifiers, sort and field specifiers

## Selectors

```javascript
{ ownerId: userId }                  // equality
{ qty: { $gt: 0 } }                  // operators
{ tags: { $in: ["a", "b"] } }
{ $or: [{ qty: 0 }, { archived: true }] }
{ "address.city": "Berlin" }         // dotted path
```

## Live-selector compatibility

MongoDB can evaluate queries that Minimongo cannot faithfully re-match against
live events. These release/package pairs add explicit guards:

| Meteor | `mongo` | `minimongo` |
|---|---|---|
| 3.4.4 | 2.3.2 | 2.1.2 |
| 3.5.5 | 2.5.2 | 2.2.0_2 |
| 3.6.1 | 2.6.1 | 2.2.2 |

Inspect `.meteor/versions`; do not infer a backport from the minor release.
The guards decline live matching for `$type`, `$elemMatch` nested under
`$not`/`$nor`, PCRE syntax outside JavaScript regex semantics, and collation
options whose semantics diverge. Examples include collation strength above 3,
strength 2 with `caseLevel`, and enabled `backwards` or `normalization`.
This is not a blanket ban on collation or ordinary regex selectors.

On these packages, oplog and, where available, change streams decline the
affected query. Verify a usable polling fallback and compare initial results
with subsequent updates, removals and resubscriptions. Preserve authorization,
field projection and selector meaning; do not remove an operator to force a
faster driver or patch out the guard. Plan for polling's performance cost with
appropriate indexes and bounded queries.

Meteor 3.5+ can select polling with the documented reactivity order. Meteor
3.4.4 has no core change streams or `METEOR_REACTIVITY_ORDER`; use its existing
oplog/polling path. Older packages lack these guards and may select a live
driver whose results diverge. Check a compatible security update or use a
supported polling configuration for that release, then rerun the exact query.

## Modifiers

```javascript
{ $set: { title } }
{ $inc: { qty: 1 } }
{ $push: { tags: "new" } }
{ $addToSet: { tags: "new" } }
{ $pull: { tags: "old" } }
{ $unset: { archived: 1 } }
```

## Sort specifiers

```javascript
{ sort: { createdAt: -1 } }
{ sort: [["score", "desc"], ["createdAt", "asc"]] }
```

## Field specifiers

Always project. Returning a whole document leaks columns.

```javascript
{ fields: { title: 1, qty: 1 } }      // include only these
{ fields: { secretToken: 0 } }        // exclude this; everything else included
```

Mixing `1`s and `0`s in one specifier is invalid except for `_id`.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/collections.md#selectors
