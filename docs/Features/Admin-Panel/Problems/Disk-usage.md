# Disk-usage monitor and Admin Panel → Problems → Disk usage

Status: **Implemented** (2026-10-17) · Owner: xet7 · Files:
`server/lib/diskMonitor.js`, `server/lib/diskLog.js` (through the shared
`server/lib/resourceLog.js`), `models/lib/diskHighTracker.js`, the `disk` stream in
`models/eventLog.js`, Admin Panel → Problems → **Disk usage**
(`/admin/problems/disk`). Tests: `tests/diskHighTracker.test.cjs`,
`tests/resourceMonitorsWiring.test.cjs`.

## What it is

Sibling of the [CPU-usage](CPU-usage.md) and [RAM-usage](RAM-usage.md) monitors. A
disk that fills up breaks WeKan (and FerretDB/SQLite) hard: uploads fail, the database
cannot write, and other software on the same machine stops too. This subsystem
**watches** free disk space on the filesystems WeKan uses and records only the
**start and end** of each sustained high-usage period to an **Admin Panel → Problems →
Disk usage** report, so operators get an early, self-describing warning before the
disk is full — without a flood of rows.

## Read more

- [statfs(2)](https://man7.org/linux/man-pages/man2/statfs.2.html) - the Linux
  call whose block counts the percentage is computed from, and
  [Node.js `fs`](https://nodejs.org/api/fs.html) (`fs.statfsSync`).
- [Disk storage](https://en.wikipedia.org/wiki/Disk_storage) and
  [Hysteresis](https://en.wikipedia.org/wiki/Hysteresis) on Wikipedia.
- WeKan: [CPU-usage](CPU-usage.md), [RAM-usage](RAM-usage.md),
  [Filename](../../General/Filename/Filename.md) (the pre-upload free-space
  check), [Database problems](Database-problems.md) (the database's own disk
  space finding).

## How to use it

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **Disk usage**.
4. Read the live lines at the top: one per filesystem, with **Disk usage** N%,
   free / total GB, its path and what WeKan keeps there (database, attachments,
   uploads). They refresh every 30 seconds; a filesystem in a high period is
   highlighted.
5. Below them, the table lists past high-usage periods, a start row and an end
   row for each. Type in the search box to filter as you type.
6. Acknowledge or clear the stream on [Summary](Summary.md).

To watch other paths, such as a database on its own disk, set
`WEKAN_DISK_WATCH_PATHS` (see [Environment variables](#environment-variables))
and restart WeKan.

## How the numbers are calculated

- **Total** = `bsize × blocks`, **available** = `bsize × bavail` (what a
  non-root process may still write, capped at the total), and **used %** =
  `round((total − available) / total × 100)` (`statfsUsage` in
  [models/lib/diskHighTracker.js](../../../../models/lib/diskHighTracker.js)).
  Missing numbers or a zero-sized filesystem give no reading.
- **GB** are binary (1024³ bytes), shown with one decimal under 10 and as a whole
  number from 10 up.
- **Sampling** every `WEKAN_DISK_SAMPLE_INTERVAL_MS` (30 s, at least 5 s).
- **Start**: after `WEKAN_DISK_HIGH_SAMPLES` (2) consecutive samples at/above
  `WEKAN_DISK_HIGH_PERCENT` (90% used). **End**: after `WEKAN_DISK_LOW_SAMPLES`
  (2) consecutive samples below `WEKAN_DISK_LOW_PERCENT` (85% used). Tracked per
  filesystem.
- **Peak** = the highest used % during the episode; **duration** = end − start,
  shown in seconds under 120 s and in rounded minutes from there.
- **Severity**: `high` at ≥ 95% used (imminent failure), else `medium`. The end row
  is `info`.

## How it works in WeKan

### Requirements

1. While WeKan (and FerretDB alongside it) run, watch how much **disk space** is used
   on the filesystems that matter: the data/state filesystem (FerretDB SQLite / Mongo
   data), the attachments storage path (`WRITABLE_PATH` / the configured storage), and
   the temp path used while sanitizing uploads.
2. Add an **Admin Panel → Problems → Disk usage** report.
3. Log **when high usage starts** and **when high usage ends** — only those two rows
   per episode, so the report never floods.
4. Each row records **how much disk is used and free** (used / total and percentage)
   per watched filesystem, the peak during the episode, its duration, and what
   WeKan/FerretDB were doing at the time.
5. Best-effort and never throws; a no-op where free-space info is unavailable (e.g. a
   sandbox where `statfs` is not permitted) — this mirrors the existing upload
   disk-space check in [Filename](../../General/Filename/Filename.md), which already falls back
   to small-RAM chunked streaming when free space cannot be read.

### Design

Mirrors the CPU/RAM subsystems so the three Problems monitors share one shape, one
event-stream mechanism, and one report template.

**Measurement — the filesystems WeKan uses.**
[server/lib/diskMonitor.js](../../../../server/lib/diskMonitor.js) samples on an
interval (`WEKAN_DISK_SAMPLE_INTERVAL_MS`, default 30s — disks change more slowly
than CPU/RAM, so a longer interval avoids needless `statfs` calls):

- Uses `fs.statfsSync(path)` (Node ≥ 18) for each watched path; where it does not
  exist, nothing is sampled.
- Watched paths, each measured once per filesystem (paths on the same device - the
  `dev` of `fs.statSync` - share one line and one episode): in the snap,
  `SNAP_COMMON`, which holds the database; the files root WeKan stores attachments
  in (`WRITABLE_PATH`, or its `files` directory, as the self-checks use it); and
  its `temp` directory (uploads). A path that does not exist is skipped.
  `WEKAN_DISK_WATCH_PATHS` (a `:`-separated list) replaces the defaults for other
  layouts, such as a database on its own disk.

**Start/end only — [models/lib/diskHighTracker.js](../../../../models/lib/diskHighTracker.js).**
A pure, unit-tested state machine (the `HighCpuTracker` of `cpuHighTracker.js`),
tracked **per watched filesystem** so a full data disk and a full attachments disk
are distinct episodes. Hysteresis prevents flapping, and the peak used% seen during
the episode is kept for the end row.

**Report — Admin Panel → Problems → Disk usage.** Episodes are written to the
`eventLog` collection on the **`disk`** stream (alongside `cpu` and `ram`) by
[server/lib/diskLog.js](../../../../server/lib/diskLog.js) through
[server/lib/resourceLog.js](../../../../server/lib/resourceLog.js), and shown by
the existing `eventStreamReport` template. Two rows per episode, per filesystem:

- **start** (`detected`): `high disk usage started (>= 90%) on /var/lib/wekan
  (attachments): 92% used, 6.1 GB free of 80 GB, WeKan: <activity>`
- **end** (`remediated`): `high disk usage ended after 12m on /var/lib/wekan (peak
  97%, back under 85%): 71% used, 23 GB free of 80 GB`

Above the rows, a live line per filesystem (`diskCurrentStatus` in
[client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade))
shows how full it is, free / total GB, its path and what WeKan keeps there,
refreshed every 30 seconds. The menu entry (`report-disk`) and the page title use
the existing `sandstorm-disk-usage` translation.

### Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `WEKAN_DISK_MONITOR` | `true` | Master on/off. |
| `WEKAN_DISK_SAMPLE_INTERVAL_MS` | `30000` | Sampling interval (at least 5000). |
| `WEKAN_DISK_HIGH_PERCENT` | `90` | Enter high state at/above this used %. |
| `WEKAN_DISK_LOW_PERCENT` | `85` | Leave high state below this used %. |
| `WEKAN_DISK_HIGH_SAMPLES` | `2` | Consecutive high samples to enter. |
| `WEKAN_DISK_LOW_SAMPLES` | `2` | Consecutive low samples to leave. |
| `WEKAN_DISK_WATCH_PATHS` | (auto) | `:`-separated paths to watch, overriding the defaults. |

### Notes and tests

- The tracker and the `statfs` → percentage helper are **pure functions** unit-tested
  without Meteor (positive + negative: missing free-space info, zero-total
  filesystems, per-filesystem episodes), exactly like `cpuHighTracker.js`:
  [tests/diskHighTracker.test.cjs](../../../../tests/diskHighTracker.test.cjs).
  [tests/resourceMonitorsWiring.test.cjs](../../../../tests/resourceMonitorsWiring.test.cjs)
  pins the wiring, the translations and that this page says Implemented.
- Observe-and-report only, like [RAM-usage](RAM-usage.md): WeKan cannot free disk on
  its own, so the value is an early, self-describing warning. It complements the
  existing **pre-upload** free-space check in [Filename](../../General/Filename/Filename.md),
  which already refuses/streams-carefully when the attachments disk is low.

## Commits

 - [Resource monitors are not named like vulnerabilities](https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523)
 - [Name the watched path, not an archive entry](https://github.com/wekan/wekan/commit/0b6942687fa55586ddf62ac162c3f2ddb63fca04)
 - [Add the Memory usage and Disk usage reports](https://github.com/wekan/wekan/commit/b6a3d98736ebf58ef3905613e303d091ef89f65a)
 - [Write the RAM and Disk designs under Admin-Panel/Problems](https://github.com/wekan/wekan/commit/f306061273e12958d715452f27d19c8001925a2c)
