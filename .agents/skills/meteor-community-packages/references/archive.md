# `jam:archive`

Use `jam:archive` when deleted documents should move from their source
collection into a separate archive collection. Read the
[Meteor guide](https://docs.meteor.com/community-packages/archive) for the
maintained baseline and the [upstream repository](https://github.com/jamauro/archive)
for the current release, complete API, and issues.

## Baseline

- Meteor 3.0.2+. On Meteor 3.0.0 or 3.0.1, upgrade Meteor or choose another
  design.
- Create an archive collection, named `archives` by default.
- Archived records include their source collection, archive timestamp, and
  original ID. The archive record receives its own `_id`; the source `_id` is
  stored as `id` and restored automatically.
- By default, `removeAsync` archives. `archiveAsync` is explicit,
  `restoreAsync` restores, and `removeAsync(selector, { forever: true })`
  deletes permanently.

```bash
meteor add jam:archive
```

```javascript
import { Mongo } from "meteor/mongo";
import { Archive } from "meteor/jam:archive";

export const Archives = new Mongo.Collection("archives");

Archive.configure({
  name: "archives",
  overrideRemove: false,
  exclude: ["roles", "role-assignment"],
});
```

## Required checks

- Choose this over soft delete only when a separate collection fits recovery,
  reporting, access-control, retention, and indexing requirements.
- Define who can read, restore, and permanently delete archived records.
- Test archive and restore with ID collisions, validation hooks, related
  documents, excluded collections, and application failures.
- Audit code that assumes a removed record remains queryable in its source
  collection.
- Removing the package does not move archived records back. Rollback requires
  an explicit data migration.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/community-packages/archive.md
