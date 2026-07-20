# Design: Disk-usage monitor and Admin Panel → Problems report

Status: **Design (proposed)** · Owner: xet7 · Related (to be added):
`server/lib/diskMonitor.js`, `server/lib/diskLog.js`, `models/lib/diskHighTracker.js`,
`models/eventLog.js`, Admin Panel → Problems → Disk usage.

Sibling of the [CPU-usage](CPU-usage.md) and [RAM-usage](RAM-usage.md) monitors. A
disk that fills up breaks WeKan (and FerretDB/SQLite) hard: uploads fail, the database
cannot write, and other software on the same machine stops too. This subsystem
**watches** free disk space on the filesystems WeKan uses and records only the
**start and end** of each sustained high-usage period to an **Admin Panel → Problems →
Disk usage** report, so operators get an early, self-describing warning before the
disk is full — without a flood of rows.

## 1. Requirements

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
   disk-space check in [Filename](../../Filename/Filename.md), which already falls back
   to small-RAM chunked streaming when free space cannot be read.

## 2. Design

Mirrors the CPU/RAM subsystems so the three Problems monitors share one shape, one
event-stream mechanism, and one report template.

### Measurement — the filesystems WeKan uses

`server/lib/diskMonitor.js` samples on an interval (`WEKAN_DISK_SAMPLE_INTERVAL_MS`,
default 30s — disks change more slowly than CPU/RAM, so a longer interval avoids
needless `statfs` calls):

- Uses `fs.statfs(path)` (Node ≥ 18) for each watched path: `bsize × blocks` =
  total bytes, `bsize × bavail` = bytes available to non-root. Used% =
  `(total − available) / total × 100`.
- Watched paths (de-duplicated by the filesystem they resolve to, so one physical
  disk is reported once): the data/state directory, `WRITABLE_PATH` (attachments),
  and `WRITABLE_PATH/files/temp` (upload sanitizing). Configurable via
  `WEKAN_DISK_WATCH_PATHS` (a `:`-separated list) for non-standard layouts.

### Start/end only — `models/lib/diskHighTracker.js`

A pure, unit-tested state machine (identical shape to `cpuHighTracker.js`), tracked
**per watched filesystem** so a full data disk and a full attachments disk are
distinct episodes. Hysteresis prevents flapping:

- enter the high state after `WEKAN_DISK_HIGH_SAMPLES` (2) consecutive samples at/above
  `WEKAN_DISK_HIGH_PERCENT` (default 90% used);
- leave it after `WEKAN_DISK_LOW_SAMPLES` (2) consecutive samples below
  `WEKAN_DISK_LOW_PERCENT` (default 85% used);
- track the peak used% seen during the episode for the end row.

### Report — Admin Panel → Problems → Disk usage

Episodes are written to the `eventLog` collection on the **`disk`** stream (alongside
`cpu` and `ram`), shown by the existing `eventStreamReport` template. Two rows per
episode, per filesystem:

- **start** (`detected`): `high disk usage started (>= 90%) on /var/lib/wekan
  (attachments): 92% used, 6.1 GB free of 80 GB, WeKan: <activity>`
- **end** (`remediated`): `high disk usage ended after 12m on /var/lib/wekan (peak
  97%, back under 85%): 71% used, 23 GB free of 80 GB`

Severity: `high` at ≥ 95% used (imminent failure), else `medium`.

## 3. Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `WEKAN_DISK_MONITOR` | `true` | Master on/off. |
| `WEKAN_DISK_SAMPLE_INTERVAL_MS` | `30000` | Sampling interval. |
| `WEKAN_DISK_HIGH_PERCENT` | `90` | Enter high state at/above this used %. |
| `WEKAN_DISK_LOW_PERCENT` | `85` | Leave high state below this used %. |
| `WEKAN_DISK_HIGH_SAMPLES` | `2` | Consecutive high samples to enter. |
| `WEKAN_DISK_LOW_SAMPLES` | `2` | Consecutive low samples to leave. |
| `WEKAN_DISK_WATCH_PATHS` | (auto) | `:`-separated paths to watch, overriding the defaults. |

## 4. Notes

- The tracker and the `statfs` → percentage helper are **pure functions** unit-tested
  without Meteor (positive + negative: missing free-space info, zero-total
  filesystems, per-filesystem episodes), exactly like `cpuHighTracker.js`.
- Observe-and-report only, like [RAM-usage](RAM-usage.md): WeKan cannot free disk on
  its own, so the value is an early, self-describing warning. It complements the
  existing **pre-upload** free-space check in [Filename](../../Filename/Filename.md),
  which already refuses/streams-carefully when the attachments disk is low.
