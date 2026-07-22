# Admin Panel → Problems

Status: **Implemented** · Owner: xet7

**Admin Panel → Problems** is where a WeKan admin sees what is wrong or in
progress: performance (CPU / RAM / disk), data-safety and recovery, migrations and
repairs, broken data, and the causes that can keep users off the login page. Open
it at **Admin Panel → Problems** (you must be an admin — `currentUser.isAdmin`).

The same information is available **without** the Admin Panel, from the server
command line, via `snap run wekan.problems` — see **[Snap.md](Snap.md)** — so an
admin who only has server (snap) access can read it without being given Admin
Panel access.

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

## Detailed pages in this directory

| Page | What it covers |
| --- | --- |
| [Repairs.md](Repairs.md) | Automatic board data-repairs (#6484 lists that vanish, orphaned/missing-swimlane cards): what they fix, when they run (board open, server startup, during migration), and the progress dashboard. |
| [Migrations.md](Migrations.md) | The MongoDB ↔ FerretDB v1 (SQLite) text-data migration, the repair phase it runs, and the shared blue, Product-name-branded progress dashboard. |
| [Login-Problems.md](Login-Problems.md) | Everything that can make the login page show "Must be logged in" or a stuck "Loading, please wait." spinner, and how to fix each. |
| [Snap.md](Snap.md) | The `snap run wekan.problems` commands that print this whole overview (and problem-specific detail like CPU) as text. |
| [CPU-usage.md](CPU-usage.md) | CPU-usage monitor / governor and the CPU report. A pegged **ferretdb** process is the usual cause of slow pages. |
| [RAM-usage.md](RAM-usage.md) | RAM-usage report. |
| [Disk-usage.md](Disk-usage.md) | Disk-usage report. |
| [Recovery.md](Recovery.md) | SQLite corruption/bloat safety and the automatic Recovery history. |

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
