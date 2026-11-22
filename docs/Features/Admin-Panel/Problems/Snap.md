# Admin Panel → Problems: snap commands

Status: **Implemented** · Owner: xet7 · Related: `snap-src/bin/wekan-problems`,
`snap-src/bin/wekan-problems.mjs`, `snapcraft.yaml` (`apps: problems`),
`server/lib/systemStatus.js`, `models/lib/loginProblems.js`,
`models/lib/problemsOverview.js`.

## What it is

On the **snap**, the Admin Panel → Problems **Status** overview is also available
as plain text from the server command line, so an admin who has server (snap)
access can read it **without** being given Admin Panel access - and even when
the web page does not load. It shows what migration or repair is running, which
problems are detected, the login-page checks, and which copy of the data the
snap is serving.

The command reads the live database directly over the MongoDB wire protocol
(MongoDB and FerretDB v1/SQLite both speak it; the snap runs one at a time on port
27019), using the bundled Node.js and `mongodb` driver — no `mongosh` needed. It
only **reads**; it never changes anything.

## Read more

- [Snap documentation](https://snapcraft.io/docs) - what a snap is and how
  `snap run` works.
- [WeKan in the Snap Store](https://snapcraft.io/wekan).
- [MongoDB wire protocol](https://www.mongodb.com/docs/manual/reference/mongodb-wire-protocol/) -
  how the command talks to MongoDB and FerretDB alike.
- [Load (computing)](https://en.wikipedia.org/wiki/Load_(computing)) on
  Wikipedia - the 1/5/15-minute load average the `cpu` command prints.
- In WeKan: [Problems README](README.md), [Summary.md](Summary.md),
  [Migrations.md](Migrations.md), [Login-Problems.md](Login-Problems.md),
  [CPU-usage.md](CPU-usage.md).

## How to use it

1. Log in to the server that runs the WeKan snap (SSH or a console).
2. Run `snap run wekan.problems` for the whole overview.
3. Read **In progress**: if a migration or repair is listed, slow logins are
   expected until it finishes.
4. Read **Problems** and the **Login page** checks; each line says what to
   change.
5. Read **Databases on this machine**. If it says there are two copies and what
   WeKan shows looks older than your work, run the
   `database-compare` command it prints (it changes nothing).
6. For one part only, add its name: `migrations`, `login`, `broken-cards` or
   `cpu` (see the list below).

### Commands

```
snap run wekan.problems                # full Status overview (default)
snap run wekan.problems migrations     # only migrations / repairs in progress
snap run wekan.problems login          # only the login-page "Must be logged in" checks
snap run wekan.problems broken-cards   # only the broken-cards count
snap run wekan.problems cpu            # machine CPU load / core count (no DB needed)
snap run wekan.problems help
```

`migrations` and `repairs` are aliases for the same in-progress list. `status`
is the same as no argument. `help` (also `-h`, `--help`) prints the usage line.

## How the numbers are calculated

From [snap-src/bin/wekan-problems.mjs](../../../../snap-src/bin/wekan-problems.mjs):

| Number | How it is computed |
| --- | --- |
| Broken cards | `countDocuments` of `cards` where `boardId`, `swimlaneId` or `listId` is null or `''`. (The printed line also says "or bad type", but the count does not check the type.) |
| Database migration progress | `collectionsDone/collectionsTotal` collections while migrating, `boardsDone/boardsTotal` boards while repairing, from the `text-migration` document of `text_migration_status`. |
| Board data-repair progress | `boardsDone/boardsTotal` from the `board-repair` document of `text_migration_status`. |
| cores | `os.cpus().length`. |
| load average | `os.loadavg()`, printed with two decimals, for 1, 5 and 15 minutes. Sustained load near or above the core count means the machine is saturated. |
| uptime | `os.uptime()`, rounded to whole seconds. |
| Connection timeouts | 5000 ms to select a server and 5000 ms to connect; when they pass, the command prints `could not read the database` and exits with code 1. |

## How it works in WeKan

### What the overview prints

```
<Product name> Problems — Status
Database: mongodb://127.0.0.1:27019/wekan

In progress:
  - Database migration (toFerretDB) — migrating: cards (3/30 collections)
  - Board data-repair — 12/40 boards
  (or) (none) No migrations or repairs are in progress.

Problems:
  - [warning] Broken cards: 5 card(s) with a missing board/list/swimlane or bad type.
  - [error]   ROOT_URL: ROOT_URL is not set. ...
  (or) (none) No problems detected.

Login page ("Must be logged in" / "Loading, please wait") checks:
  [warning] Migration or repair — Logins may be slow ...
  [ok]      ROOT_URL — ROOT_URL=https://boards.example.com ...
  ...
More: wekan.problems cpu | login | migrations | broken-cards

Databases on this machine
-------------------------
  Serving: ...
  MongoDB files in /var/snap/wekan/common: yes
  FerretDB database in /var/snap/wekan/common/files/db: yes
```

The heading uses the configured **Product name** (Admin Panel → Settings →
Appearance → Custom Product Name) when set, otherwise `WeKan`. (This page used
to name the pane Settings → Layout; the setting is in Appearance now.)

**In progress** is read from persisted status collections: the `text-migration`
and `board-repair` documents of `text_migration_status`, an active
`recoveryStatus`, running `cronJobStatus` jobs and a running
`attachmentMigrationStatus`.

**Login page checks** mirror [models/lib/loginProblems.js](../../../../models/lib/loginProblems.js):
"Migration or repair" (a warning while anything is in progress), "ROOT_URL"
(an error when it is not set), and the informational "LDAP is enabled" and
"Running under Sandstorm" lines. A failing check is also listed under Problems.

**Databases on this machine** is printed by the shell wrapper
[snap-src/bin/wekan-problems](../../../../snap-src/bin/wekan-problems) after the
overview (for no argument, `status` or `databases`): which database is being
served (`database-role --why`), whether MongoDB files and a FerretDB database
exist in `$SNAP_COMMON`, and, when both do, the `database-compare` and
`database-merge` commands to run. It reads only the files, so it works even
when the site is down.

### Problem-specific detail: CPU

`snap run wekan.problems cpu` needs no database and prints the machine's core count
and 1/5/15-minute load average:

```
CPU usage
  cores:        4 (...)
  load average: 3.90 (1m)  3.40 (5m)  2.10 (15m)
  uptime:       ... s
  Note: sustained load near or above the core count means the machine is saturated.
  A migration/repair (see "wekan.problems") can push CPU up; it drops when it finishes.
```

If `top` shows the **ferretdb** process pegged near 100%/200% for a long time, the
FerretDB v1 (SQLite) backend is saturated under WeKan's poll load — the usual cause
of pages taking minutes, counts stuck at `0`, and raw i18n keys. Mitigations: check
whether a migration/repair is still running (`snap run wekan.problems migrations`),
and check the reactivity mode below (`snap set wekan wekan-ferretdb-oplog=false`, then
migrate the text data across — see [Migrations.md](Migrations.md)).

### Notes

- The command connects to the database given as the second argument, else
  `WEKAN_PROBLEMS_URL`, else `MONGO_URL`, else `mongodb://127.0.0.1:27019/wekan`,
  and always reads the `wekan` database.
- "In progress" is read from persisted status collections (`text_migration_status`,
  `recoveryStatus`, `cronJobStatus`, `attachmentMigrationStatus`), so it stays
  correct even if the WeKan server process restarts mid-migration.
- The `login` checks read `ROOT_URL`, `LDAP_ENABLE` and Sandstorm from the
  environment. The wrapper loads the snap settings first
  (`wekan-read-settings`), so `snap set wekan root-url=...` is what the check
  sees.
- The `mongodb` driver is taken from the WeKan bundle inside the snap; when it
  cannot be found the command exits with a FATAL message.
- The snap app is declared in [snapcraft.yaml](../../../../snapcraft.yaml) as
  `problems`, with the `network` and `network-bind` plugs.

### Tests

- [tests/problemsStatus.test.cjs](../../../../tests/problemsStatus.test.cjs) -
  the Status overview and the snap command agree.
- [tests/snapProblemsDatabases.test.cjs](../../../../tests/snapProblemsDatabases.test.cjs) -
  the "Databases on this machine" section.

## Commits

 - [Revert reading the startup network file in the wrapper; MONGO_URL stays the fallback](https://github.com/wekan/wekan/commit/cc94828e8546f86c4eb868d736362901da3a3043)
 - [Use the live database URL in problem reports](https://github.com/wekan/wekan/commit/e1a8ac0018e866b4765db36fd106fa7fa45e0c07)
 - [Say which copy of the data is being served](https://github.com/wekan/wekan/commit/504e450a11ac6b119c5fbf038a385b22c183e8da)
 - [Remove the snap database setting: the snap always uses FerretDB](https://github.com/wekan/wekan/commit/bb76e7bf106c6b6ee9729eddcbf51ae8e6076d51)
 - [Load the snap settings so the ROOT_URL and LDAP checks see the real configuration](https://github.com/wekan/wekan/commit/d69c83f949291837eb24409562ecd4b42c5d2033)
 - [Neutral check titles, so a failing check does not contradict itself](https://github.com/wekan/wekan/commit/0470adcf3bb9fd5390f17ce2a3cec367ee4b3da9)
 - [First version of this page](https://github.com/wekan/wekan/commit/c4a76e0e3d73afef090b160bb78743fa699bce2d)
 - [Add snap run wekan.problems and the Problems Status overview](https://github.com/wekan/wekan/commit/5a1c9a61e98d0e1bc2ce566229bcdce3f81745ae)
