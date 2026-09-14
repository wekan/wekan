# Selectors, modifiers, sort and field specifiers

## Selectors

```javascript
{ ownerId: userId }                  // equality
{ qty: { $gt: 0 } }                  // operators
{ tags: { $in: ["a", "b"] } }
{ $or: [{ qty: 0 }, { archived: true }] }
{ "address.city": "Berlin" }         // dotted path
```

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
