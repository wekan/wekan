---
name: migrate-to-meteor-3
description: >
  Use when migrating a Meteor 2.x application to Meteor 3.x. Triggers on
  callAsync, *Async Mongo, removed Fibers, implicit-global ReferenceError,
  lost Blaze reactivity, a publish function returning a Promise, a scheduler
  dropping a Promise, a read API receiving update modifiers, async allow/deny,
  an Iron Router controller not running, "Method stub took too long",
  Atmosphere resolution, Express 5 WebApp handlers, lost async context,
  rawCollection callbacks, meteor/* TypeScript types, useTracker, and
  useSubscribe. Use this skill when the user asks about upgrading Meteor,
  async caller propagation, iterators with await, zodern:types, or replacing
  and forking packages.
metadata:
  author: meteor
  kind: knowledge
  meteor: ">=3.0"
  area: migration
  tagline: "Migrate a Meteor 2.x app to 3.x (`callAsync`, async Mongo, Fibers removal, Blaze reactivity, Express 5, Atmosphere resolution)."
  bundle: ["migration"]
  docs_synced_at: "2026-08-25"
license: MIT
---

# Migrate a Meteor 2.x application to Meteor 3.x

Meteor 3 removed Fibers. Server-side Mongo APIs are async. The module system
enforces strict mode. Client reactivity inside async code needs care.
Atmosphere packages often need forking or replacement. Approach the migration
in phases. Do not flip the framework version flag first.

## Recommended strategy

1. Update the project to the latest 2.x release.
2. Run the app with `WARN_WHEN_USING_OLD_API=true meteor run`. The console
   logs every sync-API call that needs an async sibling, giving you a
   to-do list before the framework flip.
3. Migrate server-side sync Mongo calls to `*Async` siblings while still
   on 2.x. Trace each changed function through every server-side caller:
   await where the caller consumes the value, forward Promises deliberately,
   and restructure sync-only boundaries. Stop only at an async-capable
   framework boundary. See `references/async-rewrites.md` and
   `references/call-vs-callAsync.md`. A community jscodeshift codemod automates
   the easy cases, but it misses non-standard collection imports (for example,
   `meteor/<publisher>:collections`). Review the diff by hand, then audit
   callback Promise ownership and collection argument shapes.
4. Audit Atmosphere packages. Find replacements or fork outdated ones;
   pin `api.versionsFrom(['2.x', '3.0'])`. See
   `references/package-triage.md`. Save `.meteor/versions` and npm lockfile
   checkpoints so package-major changes remain distinguishable from Meteor.
5. Upgrade to Meteor 3.x.
6. Sweep implicit globals; rewrite to `const` or `export` / `import`.
   See `references/module-system.md`.
7. Audit Blaze helpers and `Tracker.autorun` blocks for lost reactivity
   after `await`. See `references/client-reactivity.md`.
8. Replace iterators that contain `await` (`forEach`, `map`, `filter`)
   with `for...of` or `Promise.all`. See `references/js-iterators.md`.
9. Audit publications using internal cursor APIs (`_cursorDescription`,
   manual `sub.added`) and framework handlers that read invocation `this`.
   Both synchronous and async publish handlers may return cursors; keep cursor
   transforms synchronous and use ordinary functions when Meteor must bind
   `this`. When a package patches `Meteor.publish` with an
   `EnvironmentVariable`, scope `publish.call` at the wrapper's top level,
   not inside the invoked handler. Verify invocation context before and after
   `await`. See `references/publications.md` and
   `references/other-breaking-changes.md`.
10. For TypeScript projects, install `zodern:types` and update
    `tsconfig.json`. See `references/typescript-migration.md`.
11. For React projects, decide whether to adopt the Suspense-aware
    `react-meteor-data` import. See `references/react-migration.md`, then use
    `meteor-react` for current hook, scaffold, and build guidance.

## Symptom router

| Symptom                                              | Reference                              |
|------------------------------------------------------|----------------------------------------|
| `TypeError: Collection.findOne is not a function`    | `references/async-rewrites.md`         |
| `Method returns undefined` or returns a `Promise`    | `references/async-rewrites.md`         |
| Downstream caller receives or reads from a `Promise` | `references/async-rewrites.md`         |
| Cron, hook, timer, or event callback drops a Promise | `references/async-rewrites.md`         |
| Read method receives `$set`, `$push`, or another modifier | `references/async-rewrites.md`     |
| `allow` / `deny` validator needs an async database read | `references/async-rewrites.md`      |
| `Meteor.call` callback never fires                   | `references/call-vs-callAsync.md`      |
| `ReferenceError: X is not defined` at startup        | `references/module-system.md`          |
| Template renders, no data, Minimongo empty           | `references/module-system.md`          |
| Iron Router controller silently does not run         | `references/module-system.md`          |
| `{{> partial}}` renders nothing in Blaze             | `references/module-system.md`          |
| Page renders but live data never updates             | `references/client-reactivity.md`      |
| Blaze helper returns a `Promise`                     | `references/client-reactivity.md`      |
| Cursor `transform` errors with "returned a Promise"  | `references/publications.md`           |
| `sub.added` writes never reach the client            | `references/publications.md`           |
| Method or publication loses `this.userId`            | `references/publications.md`           |
| Atmosphere package fails to resolve or build         | `references/package-triage.md`         |
| `forEach`/`map`/`filter` with `await` skips items    | `references/js-iterators.md`           |
| Middleware on `WebApp.connectHandlers` not firing    | `references/webapp-express.md`         |
| Route uses an unnamed wildcard after Meteor 3.1     | `references/webapp-express.md`         |
| `rawCollection` callback never fires                 | `references/other-breaking-changes.md` |
| Patched publication loses `Meteor.userId()` or async context | `references/other-breaking-changes.md` |
| `meteor reset` did not wipe the local Mongo          | `references/other-breaking-changes.md` |
| `Method stub (X) took too long` console warning      | `references/call-vs-callAsync.md`      |
| "Cannot enlarge memory array" during `meteor update` | `references/other-breaking-changes.md` |
| External callback lost `this.userId` or env vars     | `references/other-breaking-changes.md` |
| Monkey-patched `Meteor.publish` never runs           | `references/other-breaking-changes.md` |
| `meteor/*` imports resolve to `any` in TypeScript    | `references/typescript-migration.md`   |
| `useTracker` or `useSubscribe` not re-running        | `references/react-migration.md`        |

## Anti-patterns

- Do not run `meteor update --release=3` first. Async-convert and
  package-triage on 2.x first.
- Do not global-replace `findOne` with `findOneAsync`. Many callers need
  rewriting, not just `await`.
- Do not mechanically rewrite client Minimongo calls to async. Both APIs work
  on the client. Prefer sync calls in naturally synchronous Blaze and Tracker
  code; use async calls in shared or already-async flows. Wrap reactive reads
  after an `await` with `Tracker.withComputation`.
- Do not rely on Iron Router controller naming-convention lookup. Pass
  `controller:` explicitly on every route.
- Do not mix `await` and `.then()` in the same function. Pick one.
- Do not assume implicit globals work. Every top-level identifier in 3.x
  must be `const`, `let`, or `export`-ed.
- Do not invent async replacements. `Meteor.userId()` remains synchronous
  inside methods and publications; there is no `Meteor.userIdAsync()`.
- Do not use an arrow as a method or publication handler when it reads
  framework-bound `this`. An arrow ignores the invocation context Meteor
  supplies.
- Do not rewrite `api.addFiles` or `api.export` only because the app moved to
  Meteor 3. They remain supported for Atmosphere packages.

## See also

- Async: `async-rewrites.md`, `call-vs-callAsync.md`, `async-cheatsheet.md`,
  `js-iterators.md`, `removed-functions.md`.
- Runtime: `module-system.md`, `client-reactivity.md`, `publications.md`,
  `webapp-express.md`, `other-breaking-changes.md`.
- Project: `package-triage.md`, `typescript-migration.md`,
  `react-migration.md`, `eval-cases.md`.
- Current Meteor React integration after the upgrade: `meteor-react`.

## Further reading (optional)

Real-world migration write-ups for context, not for fixing specific
issues. The symptom router above is sufficient on its own. Open
`references/community-case-studies.md` only when the user asks for
narrative case studies or wants to calibrate effort and timeline.
