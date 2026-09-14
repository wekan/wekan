# `jam:soft-delete`

Use `jam:soft-delete` when deleted documents should remain in their original
collection. Read the [Meteor guide](https://docs.meteor.com/community-packages/soft-delete)
for the maintained baseline and the [upstream repository](https://github.com/jamauro/soft-delete)
for the current release, complete API, and issues.

## Baseline

- Meteor 2.8.1+ and Meteor 3.0+.
- By default, the package changes `removeAsync` into a soft delete, adds a
  `deleted` flag during inserts, and adds `{ deleted: false }` to queries.
- `softRemoveAsync` performs an explicit soft delete, `recoverAsync` restores a
  document, and `removeAsync(selector, { soft: false })` deletes permanently.

```bash
meteor add jam:soft-delete
```

Configure changed semantics explicitly when defaults do not fit:

```javascript
import { SoftDelete } from "meteor/jam:soft-delete";

SoftDelete.configure({
  deleted: "deleted",
  deletedAt: "deletedAt",
  autoFilter: true,
  overrideRemove: false,
  exclude: ["roles", "role-assignment"],
});
```

## Required checks

- Choose this over `jam:archive` only when deleted documents should remain in
  the source collection.
- Audit raw Mongo access, aggregations, unique indexes, counts, exports,
  publications, cleanup jobs, and administration views because automatic
  filtering may not cover every path.
- Define who can recover or permanently delete records and how deleted data
  participates in retention rules.
- Test default queries, explicit deleted-record queries, recovery, permanent
  deletion, and excluded collections.
- Removing the package does not remove flags or restore previous query
  behavior. Plan a data and code migration for rollback.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/soft-delete.md
