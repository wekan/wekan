# Admin Panel → Problems

Status: **Implemented** · Owner: xet7

**Admin Panel → Problems** is where a WeKan admin sees what is wrong or in
progress: performance (CPU / RAM / disk), data-safety and recovery, migrations and
repairs, broken data, and the causes that can keep users off the login page. Open
it at **Admin Panel → Problems** (you must be an admin — `currentUser.isAdmin`).

The same information is available **without** the Admin Panel, from the server
command line, via `snap run wekan.problems` — see **[Snap.md](Snap.md)** — so an
admin who only has server (snap) access can read it without being given Admin
Panel access. It is also on the REST API, for monitoring from outside:
`GET /api/admin/problems` is this overview with the new-problem count per
stream, `GET /api/admin/problems/:stream` one page of a stream, and
`POST /api/admin/problems/:stream/acknowledge` the acknowledge button - see
[REST API](../../../API/REST-API.md#admin-panel-problems).

## The Status overview (Problems → Summary)

The **Summary** tab shows a **Status** overview at the top:

- **In progress** — every migration or repair running right now (database text
  migration, board data-repair, recovery/maintenance, cron migration, attachment
  migration), gathered from the persisted status collections so it is accurate even
  across a restart.
- **Problems** — detected issues: broken cards, and any failing login-page check.
- **Login page checks** — the known causes that make the login page show
  **"Must be logged in"** or sit on the logo + **"Loading, please wait."** spinner
  (see **[Login-Problems.md](Login-Problems.md)**).

Below that is the acknowledge list of the Security / Speed / Tests problem streams.
The Security Report also records denied passwordless code requests after five
requests per source address in one minute. Meteor's per-connection Accounts
limit still applies independently.
Attempts that Meteor 3.5.3's security fixes refuse - a crashing DDP message,
a `__proto__` update field, a malformed `import()` request, an OAuth token of
another application - are recorded as **Meteor DDP**, **Meteor allow-deny**,
**Meteor dynamic-import** and **Meteor OAuth**
([details](../../../Security/Meteor-3.5.3-Security-Fixes-2026-10-22.md)).
An import or export refused by the transfer boundary (a cycle, a non-plain
object, a size limit) is **ImportExportValidation**. One that failed for
another reason - a library that threw, as sanitize-html 2.18.0 did on nested
`<iframe>` - is **ImportExportFailure**: detected, never an attempt, and it
never disables the account of the user whose import or export it was.

## The menu, in two named groups

**Settings** — the panes that hold server-wide feature switches, which are
settings rather than reports but are what an admin reaches for when something is
unsafe or noisy:

- **Security** — how rich text is rendered (links as plain text, all code as plain
  text) and the import / export privacy switches (disable all import / export,
  avatars, anonymize users). All enforced server-side.
- **Delete** — allow Global Admins to permanently purge soft-deleted content.
  The switch is off by default and enabling it deletes nothing by itself.
- **Notifications** — disable all activities, all notifications, or watching, for
  deployments that must limit activity tracking
  ([#5820](https://github.com/wekan/wekan/issues/5820)).
- **Backup** — did the Admin Panel backup work: the last successful backup,
  the last failure and its error, the next scheduled run, and the history of
  the last runs. Its settings stay in Admin Panel / Attachments / Backup; a
  failed or overdue backup is also listed on Summary
  ([Backup.md](../../../Backup/Backup.md)).

**Reports** — Security Report, Impersonation Report, Password length, Performance, Speed, Tests, CPU
usage, Instrumentation, Broken Cards, Files Report, Rules Report, Boards Report,
Cards Report, Recovery, Offices, API, Database problems, Filesystem integrity and
Email.
Report tables use the shared [table page](../../General/Table.md):
a search box, the total, `page X / N`, prev/next, and one page of rows fetched from
the server at a time. **Performance** sits with the Speed / Tests / CPU usage streams
it configures: card loading is automatic per board size, with
`CARDS_LOADING=all|lazy|auto` and `CARDS_LOADING_LAZY_THRESHOLD` for operators.

## Detailed pages in this directory

| Page | What it covers |
| --- | --- |
| [Repairs.md](Repairs.md) | Automatic board data-repairs (#6484 lists that vanish, orphaned/missing-swimlane cards): what they fix, when they run (board open, server startup, during migration), and the progress dashboard. |
| [Data-Health.md](Data-Health.md) | The nightly data health scan ([#6818](https://github.com/wekan/wekan/issues/6818)): read-only checks for data WeKan should never write (a card on a list of another board, checklist items of a deleted checklist, members whose account is gone), shown in Problems / Summary with a Repair button - one click for a repair that only moves data, a confirming second click, checked by the server, for one that deletes. |
| [Migrations.md](Migrations.md) | The MongoDB ↔ FerretDB v1 (SQLite) text-data migration, the repair phase it runs, and the shared blue, Product-name-branded progress dashboard. |
| [Login-Problems.md](Login-Problems.md) | Everything that can make the login page show "Must be logged in" or a stuck "Loading, please wait." spinner, and how to fix each. |
| [Snap.md](Snap.md) | The `snap run wekan.problems` commands that print this whole overview (and problem-specific detail like CPU) as text. |
| [CPU-usage.md](CPU-usage.md) | CPU-usage monitor / governor and the CPU report. A pegged **ferretdb** process is the usual cause of slow pages. |
| [RAM-usage.md](RAM-usage.md) | RAM-usage report. |
| [Large-Boards.md](Large-Boards.md) | What a large board loads (lazy card windows, card details on open, streamed attachments), the #6745 measurements, and sizing for 8 GB of RAM. |
| [Disk-usage.md](Disk-usage.md) | Disk-usage report. |
| [Recovery.md](Recovery.md) | SQLite corruption/bloat safety and the automatic Recovery history. |
| [Durable-Operations.md](Durable-Operations.md) | Restart-safe jobs, leases, checkpoints, idempotency, external-service retries and recovery reporting. |

## Why this exists

After an upgrade, several sites reported the login page showing "Must be logged
in", or — after login — the logo with "Loading, please wait." and a spinner that
never finished; pages took five or more minutes, the All Boards counts stayed at
`0`, and some labels showed raw i18n keys (e.g. `allboards.starred`). In `top` the
**ferretdb** process was pegged near 200% CPU for a long time. That is the FerretDB
v1 (SQLite) backend saturated under WeKan's poll load — often a migration/repair
still running, or simply a heavy instance on SQLite.

Problems → Status and `snap run wekan.problems` make that visible: an admin can now
see at a glance *"a migration/repair is in progress; that is why logins are slow"*,
or *"nothing is running; the backend itself is saturated — consider MongoDB"*, both
from the browser and from the server command line.

## How this pane records what it sees

[Design.md](Design.md) is the design behind the panes below: one summary row per
problem rather than a row per event, the per-actor tally inside it, the IPv4 and
IPv6 columns, and the API report, per-address login tally and blocking that are
still being built. Read it if you are changing how Problems records things
rather than what it shows.

## The panes, in menu order

Every pane of this tab, in the order the menu shows them. The slug is what
the address uses: `/admin/problems/<slug>`.

| Menu path | URL slug | Page |
| --- | --- | --- |
| Problems / Summary | `summary` | — |
| Problems / Security | `security` | — |
| Problems / Delete | `delete` | — |
| Problems / Notifications | `notifications` | — |
| Problems / Backup | `backup` | [Backup.md](../../../Backup/Backup.md#did-the-backup-work-history-health-and-monitoring) |
| Problems / Security Report | `security-report` | — |
| Problems / Impersonation Report | `impersonation` | — |
| Problems / Password length | `password-length` | [Password-length.md](Password-length.md) |
| Problems / Performance | `performance` | — |
| Problems / Speed | `speed` | — |
| Problems / Tests | `tests` | — |
| Problems / CPU usage | `cpu` | [CPU-usage.md](CPU-usage.md) |
| Problems / Memory Usage | `ram` | [RAM-usage.md](RAM-usage.md) |
| Problems / Disk usage | `disk` | [Disk-usage.md](Disk-usage.md) |
| Problems / Instrumentation | `instrumentation` | [Instrumentation.md](Instrumentation.md) |
| Problems / Broken Cards | `broken-cards` | — |
| Problems / Files Report | `files` | [File-status.md](File-status.md) |
| Problems / Rules Report | `rules` | — |
| Problems / Boards Report | `boards` | — |
| Problems / Cards Report | `cards` | — |
| Problems / Recovery | `recovery` | [Recovery.md](Recovery.md) |
| Problems / Offices | `office` | [Offices.md](Offices.md) |
| Problems / API | `api` | [API.md](API.md) |
| Problems / Database problems | `database` | — |
| Problems / Filesystem integrity | `integrity` | — |
| Problems / Email | `mail` | [Bounces.md](../../General/Email/Bounces.md#when-something-goes-wrong) |

15 of these 26 panes has no page of its own yet. A dash is a
gap to fill, not a pane that does nothing - what the pane shows is described in
this README until somebody writes it up.

[File status checks](File-status.md): inspect missing files, incomplete upload
metadata, detected types, storage references and available recovery evidence.
