# Server Mongo vs client Minimongo

| Aspect             | Server (Mongo, async)             | Client (Minimongo, sync)        |
|--------------------|-----------------------------------|---------------------------------|
| Read one           | `await c.findOneAsync(id)`        | `c.findOne(id)`                 |
| Read many          | `await c.find(q).fetchAsync()`    | `c.find(q).fetch()`             |
| Count              | `await c.find(q).countAsync()`    | `c.find(q).count()`             |
| Insert             | `await c.insertAsync(d)`          | `c.insert(d)` (inside stub only)|
| Update             | `await c.updateAsync(q, m)`       | `c.update(q, m)` (stub only)    |
| Remove             | `await c.removeAsync(q)`          | `c.remove(q)` (stub only)       |
| Index              | `await c.createIndexAsync(...)`   | not applicable                  |

Isomorphic code runs on both sides. Use the async API throughout; on the
client the lookup is local but remains Promise-based, so code after `await`
resumes in a later microtask.

To explain a query, use the Mongo shell (`meteor mongo`) and run
`db.<collection>.find(...).explain("executionStats")`. Meteor does not
expose a `Cursor#explain` on the collection API.

---
Source: https://github.com/meteor/meteor/blob/devel/v3-docs/docs/api/collections.md
