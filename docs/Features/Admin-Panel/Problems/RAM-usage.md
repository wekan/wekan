# Design: RAM-usage monitor and Admin Panel → Problems report

Status: **Design (proposed)** · Owner: xet7 · Related (to be added):
`server/lib/ramMonitor.js`, `server/lib/ramLog.js`, `models/lib/ramHighTracker.js`,
`models/eventLog.js`, Admin Panel → Problems → RAM usage.

Sibling of the [CPU-usage](CPU-usage.md) monitor. WeKan and FerretDB on the same
machine can use enough RAM (and push the machine into swap) to starve or crash other
software — and swapping makes everything slow. This subsystem **watches** system-wide
memory + swap usage and records only the **start and end** of each sustained
high-usage period to an **Admin Panel → Problems → RAM usage** report, so operators
can see when memory pressure began, how bad it got, and when it cleared — without a
flood of rows.

## 1. Requirements

1. While WeKan (and FerretDB alongside it) run, watch how much **RAM and swap** are
   used.
2. Add an **Admin Panel → Problems → RAM usage** report.
3. Log **when high usage starts** and **when high usage ends** — only those two rows
   per episode, so the report never floods.
4. Each row records how much **RAM** and **swap** were used (used / total and
   percentages), the peak during the episode, its duration, and what WeKan/FerretDB
   were doing at the time (the same coarse activity label the CPU monitor uses).
5. Best-effort and never throws; a no-op where the numbers are unavailable (e.g. a
   sandbox with no `/proc/meminfo`).

## 2. Design

Mirrors the CPU-usage subsystem so the three Problems monitors (CPU, RAM, Disk) share
one shape, one event-stream mechanism, and one report template.

### Measurement — system-wide, includes FerretDB

`server/lib/ramMonitor.js` samples on an interval (`WEKAN_RAM_SAMPLE_INTERVAL_MS`,
default 5s):

- **RAM**: `os.totalmem()` and `os.freemem()` give system total and free bytes. Used
  RAM% = `(total − free) / total × 100`. Measured at the OS level, so it includes
  WeKan, FerretDB and every other process — the true "is the machine low on memory"
  signal.
- **Swap**: on Linux, read `SwapTotal` and `SwapFree` from `/proc/meminfo`; used
  swap% = `(SwapTotal − SwapFree) / SwapTotal × 100`. When `/proc/meminfo` is
  unreadable or there is no swap, swap is reported as unavailable and only RAM drives
  the episode. (Node's `process.memoryUsage()` — WeKan's own RSS — is recorded in the
  detail for context but is **not** the trigger; the trigger is system-wide.)

### Start/end only — `models/lib/ramHighTracker.js`

A pure, unit-tested state machine (identical shape to `cpuHighTracker.js`) turns the
sample stream into just two events per episode, with **hysteresis** to prevent
flapping:

- enter the high state after `WEKAN_RAM_HIGH_SAMPLES` (3) consecutive samples at/above
  `WEKAN_RAM_HIGH_PERCENT` (default 90% RAM used) **OR** at/above
  `WEKAN_SWAP_HIGH_PERCENT` (default 25% swap used — any real swapping is already a
  performance problem);
- leave it after `WEKAN_RAM_LOW_SAMPLES` (3) consecutive samples with RAM below
  `WEKAN_RAM_LOW_PERCENT` (default 80%) and swap below the swap threshold;
- it tracks the peak RAM% and peak swap% seen during the episode for the end row.

### Report — Admin Panel → Problems → RAM usage

Episodes are written to the `eventLog` collection on the **`ram`** stream (a new
`securityCategories`-style stream alongside `cpu`), and shown by the existing
`eventStreamReport` template (paginated, searchable, read-only). Two rows per episode:

- **start** (`detected`): `high RAM usage started (>= 90%): RAM 7.4/8.0 GB (92%),
  swap 0.6/2.0 GB (30%), load …, WeKan: <activity>`
- **end** (`remediated`): `high RAM usage ended after 42s (peak RAM 96%, peak swap
  41%, back under 80%): RAM 5.1/8.0 GB (64%), swap 0.1/2.0 GB (5%)`

Severity: `high` when RAM peak ≥ 95% or swap is in use, else `medium`.

## 3. Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `WEKAN_RAM_MONITOR` | `true` | Master on/off. |
| `WEKAN_RAM_SAMPLE_INTERVAL_MS` | `5000` | Sampling interval. |
| `WEKAN_RAM_HIGH_PERCENT` | `90` | Enter high state at/above this RAM used %. |
| `WEKAN_RAM_LOW_PERCENT` | `80` | Leave high state below this RAM used %. |
| `WEKAN_SWAP_HIGH_PERCENT` | `25` | Also enter high state at/above this swap used %. |
| `WEKAN_RAM_HIGH_SAMPLES` | `3` | Consecutive high samples to enter. |
| `WEKAN_RAM_LOW_SAMPLES` | `3` | Consecutive low samples to leave. |

## 4. Notes

- The tracker and the `/proc/meminfo` parser are **pure functions** unit-tested
  without Meteor, exactly like `cpuHighTracker.js` and its tests, so the enter/leave
  hysteresis and the meminfo parsing (including missing/zero swap) are covered by
  positive and negative tests.
- This is intentionally **observe-and-report only**: unlike CPU, WeKan cannot safely
  "free" RAM on demand, so there is no governor here — the value is visibility (a
  self-describing start→end record) so an operator can size the host or cap
  concurrency. See [CPU-usage](CPU-usage.md) for the governed sibling and
  [Disk-usage](Disk-usage.md) for the disk sibling.
