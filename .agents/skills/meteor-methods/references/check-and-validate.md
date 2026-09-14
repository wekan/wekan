# Validating method arguments

Every method argument must be validated. Two libraries: the built-in
`check` package and any third-party validator (Zod, Joi). For new code,
prefer `check`.

## Primitive shapes

```javascript
check(value, String);          // string
check(value, Number);           // number, including NaN. Use Match.Integer
                                // for integers.
check(value, Boolean);
check(value, Date);
check(value, Object);           // any object
check(value, Array);            // any array
check(value, null);
check(value, undefined);
```

## Composite

```javascript
check(value, {
  title: String,
  qty: Match.Integer,
  tags: [String],
  notes: Match.Optional(String),
  meta: Match.ObjectIncluding({ source: String }),
});
```

## Union and refinement

```javascript
check(value, Match.OneOf(String, Number));
check(value, Match.Where((v) => typeof v === "string" && v.length <= 80));
```

## When to use Zod

If you already use Zod for HTTP boundaries, you can call `schema.parse(value)`
inside the method. The Meteor-specific `check` advantage is that mismatches
throw `Match.Error` which Meteor maps to a `400` DDP error automatically.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/check.md
