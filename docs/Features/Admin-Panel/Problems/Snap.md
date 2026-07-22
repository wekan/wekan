# Admin Panel → Problems: snap commands

Status: **Implemented** · Owner: xet7 · Related: `snap-src/bin/wekan-problems`,
`snap-src/bin/wekan-problems.mjs`, `snapcraft.yaml` (`apps: problems`),
`server/lib/systemStatus.js`, `models/lib/loginProblems.js`,
`models/lib/problemsOverview.js`.

On the **snap**, the Admin Panel → Problems **Status** overview is also available
as plain text from the server command line, so an admin who has server (snap)
access can read it **without** being given Admin Panel access.

The command reads the live database directly over the MongoDB wire protocol
(MongoDB and FerretDB v1/SQLite both speak it; the snap runs one at a time on port
27019), using the bundled Node.js and `mongodb` driver — no `mongosh` needed. It
only **reads**; it never changes anything.

## Commands

```
snap run wekan.problems                # full Status overview (default)
snap run wekan.problems migrations     # only migrations / repairs in progress
snap run wekan.problems login          # only the login-page "Must be logged in" checks
snap run wekan.problems broken-cards   # only the broken-cards count
snap run wekan.problems cpu            # machine CPU load / core count (no DB needed)
snap run wekan.problems help
```

`migrations` and `repairs` are aliases for the same in-progress list.

## What the overview prints

```
<Product name> Problems — Status
Database: mongodb://127.0.0.1:27019/wekan

In progress:
  - Database migration (toFerretDB) — migrating: cards (3/30 collections)
  - Board data-repair — 12/40 boards
  (or) (none) No migrations or repairs are in progress.

Problems:
  - [warning] Broken cards: 5 card(s) with a missing board/list/swimlane or bad type.
  - [error]   ROOT_URL is not set. ...
  (or) (none) No problems detected.

Login page ("Must be logged in" / "Loading, please wait") checks:
  [warning] A migration or repair is in progress — ...
  [ok]      ROOT_URL is set — ROOT_URL=https://boards.example.com ...
  ...
More: wekan.problems cpu | login | migrations | broken-cards
```

The heading uses the configured **Product name** (Admin Panel → Settings → Layout
→ Product name) when set, otherwise `WeKan`.

## Problem-specific detail: CPU

`snap run wekan.problems cpu` needs no database and prints the machine's core count
and 1/5/15-minute load average:

```
CPU usage
  cores:        4 (...)
  load average: 3.90 (1m)  3.40 (5m)  2.10 (15m)
  uptime:       ...
  Note: sustained load near or above the core count means the machine is saturated.
  A migration/repair (see "wekan.problems") can push CPU up; it drops when it finishes.
```

If `top` shows the **ferretdb** process pegged near 100%/200% for a long time, the
FerretDB v1 (SQLite) backend is saturated under WeKan's poll load — the usual cause
of pages taking minutes, counts stuck at `0`, and raw i18n keys. Mitigations: check
whether a migration/repair is still running (`snap run wekan.problems migrations`),
and consider running on MongoDB instead (`snap set wekan database=mongodb`, then
migrate the text data across — see [Migrations.md](Migrations.md)).

## Notes

- The command connects to `mongodb://127.0.0.1:27019/wekan` by default. Override
  with a second argument or the `WEKAN_PROBLEMS_URL` environment variable.
- "In progress" is read from persisted status collections (`text_migration_status`,
  `recoveryStatus`, `cronJobStatus`, `attachmentMigrationStatus`), so it stays
  correct even if the WeKan server process restarts mid-migration.
- The `login` checks read `ROOT_URL`, `LDAP_ENABLE` and Sandstorm from the
  environment, so run the command in the snap's environment for accurate values.
