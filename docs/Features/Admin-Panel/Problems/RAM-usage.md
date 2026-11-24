# RAM-usage monitor and Admin Panel → Problems → Memory Usage

Status: **Implemented** (2026-10-17) · Owner: xet7 · Files:
`server/lib/ramMonitor.js`, `server/lib/ramLog.js` (through the shared
`server/lib/resourceLog.js`), `models/lib/ramHighTracker.js`, the `ram` stream in
`models/eventLog.js`, Admin Panel → Problems → **Memory usage**
(`/admin/problems/ram`). Tests: `tests/ramHighTracker.test.cjs`,
`tests/resourceMonitorsWiring.test.cjs`.

## What it is

WeKan watches how much memory (RAM) and swap the whole machine uses, and writes
down only when a period of high memory use **starts** and when it **ends**. An
administrator opens Admin Panel → Problems → Memory usage to see when memory
pressure began, how bad it got and when it cleared, without a flood of rows. It
is the sibling of the [CPU-usage](CPU-usage.md) monitor and the
[Disk-usage](Disk-usage.md) monitor.

WeKan and FerretDB on the same machine can use enough RAM (and push the machine
into swap) to starve or crash other software — and swapping makes everything
slow. This report makes that visible.

## Read more

- [Memory paging](https://en.wikipedia.org/wiki/Memory_paging) on Wikipedia -
  what swap is and why using it makes a machine slow.
- [Hysteresis](https://en.wikipedia.org/wiki/Hysteresis) on Wikipedia - why the
  monitor has a separate "start" and "end" threshold.
- [proc_meminfo(5)](https://man7.org/linux/man-pages/man5/proc_meminfo.5.html) -
  the Linux `/proc/meminfo` fields `MemTotal`, `MemAvailable`, `SwapTotal` and
  `SwapFree` the monitor reads.
- In WeKan: [CPU-usage.md](CPU-usage.md), [Disk-usage.md](Disk-usage.md),
  [Problems README](README.md), the shared [table page](../../Table.md).

## How to use it

**Read the report**

1. Log in as a site administrator.
2. Click your avatar or username at the top right and choose **Admin Panel**.
3. Click the **Problems** tab at the top.
4. In the left menu, under **Reports**, click **Memory usage**
   (`/admin/problems/ram`).
5. The line at the top shows the current RAM use (percentage and used / total
   GB) and swap when the machine has any. It refreshes every 5 seconds.
6. Below it, the table lists the start and end rows of every high-memory
   period, newest first, 10 rows a page. Type in the search box to filter.

**Acknowledge or clear it**

1. Open Problems → **Summary**.
2. Tick the **Admin Panel → Problems → Memory usage** line.
3. Click **Acknowledge** to reset its new-problem count, or **Clear** to delete
   its rows ([Summary.md](Summary.md)).

**Change the thresholds**

1. Set the environment variables in the table under
   [Environment variables](#3-environment-variables) below, for example
   `WEKAN_RAM_HIGH_PERCENT=85`.
2. Restart WeKan. The values are read once, at server start.

## How the numbers are calculated

All from `models/lib/ramHighTracker.js` and `server/lib/ramMonitor.js`.

| Number | How it is computed |
| --- | --- |
| RAM used % | `(MemTotal − MemAvailable) / MemTotal × 100` from `/proc/meminfo`, rounded to a whole percent and clamped to 0-100. Without `/proc/meminfo` it is `(os.totalmem() − os.freemem()) / os.totalmem()`. |
| Swap used % | `(SwapTotal − SwapFree) / SwapTotal × 100`, rounded and clamped the same way. With no swap, or no `/proc/meminfo`, swap is "unavailable" (`no swap` in the row) and only RAM decides. |
| GB values | bytes / 1024³, shown with one decimal (`7.4/8.0 GB`). |
| Sample interval | `WEKAN_RAM_SAMPLE_INTERVAL_MS`, default 5000 ms, never less than 1000 ms. |
| Start of a high period | `WEKAN_RAM_HIGH_SAMPLES` (default 3, at least 1) samples in a row where RAM ≥ `WEKAN_RAM_HIGH_PERCENT` (90) **or** swap ≥ `WEKAN_SWAP_HIGH_PERCENT` (25) while RAM ≥ `WEKAN_RAM_LOW_PERCENT` (80). With the defaults that is 15 seconds. |
| End of a high period | `WEKAN_RAM_LOW_SAMPLES` (default 3, at least 1) samples in a row with RAM below `WEKAN_RAM_LOW_PERCENT` (80). |
| Peak RAM / peak swap | the highest RAM % and swap % seen while the period was open. |
| Duration | end time − start time, in whole seconds (`ended after 42s`). |
| Severity | the start row is `high` when RAM is at 95 % or more at the moment the period starts, otherwise `medium`; the end row is always `info`. |
| New-problem count | rows newer than the last acknowledgement whose severity is not `info` (`models/lib/eventLogProblems.js`), so an end row is never counted. |
| Retention | rows older than `EVENTLOG_RETENTION_DAYS` (default 90; `0` keeps them) are deleted once a day. |

## How it works in WeKan

### 1. Requirements

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

### 2. Design

Mirrors the CPU-usage subsystem so the three Problems monitors (CPU, RAM, Disk) share
one shape, one event-stream mechanism, and one report template.

#### Measurement — system-wide, includes FerretDB

[server/lib/ramMonitor.js](../../../../server/lib/ramMonitor.js) samples on an
interval (`WEKAN_RAM_SAMPLE_INTERVAL_MS`, default 5s):

- **RAM**: on Linux, `MemTotal` and `MemAvailable` from `/proc/meminfo`; used RAM% =
  `(total − available) / total × 100`. `MemAvailable` counts the page cache the
  kernel can drop as available - `os.freemem()` (MemFree) does not, and would show a
  healthy server with a full cache as out of memory. Without `/proc/meminfo` (not
  Linux, or an old kernel) the monitor uses `os.totalmem()` and `os.freemem()`.
  Measured at the OS level, so it includes WeKan, FerretDB and every other
  process — the true "is the machine low on memory" signal.
- **Swap**: on Linux, read `SwapTotal` and `SwapFree` from `/proc/meminfo`; used
  swap% = `(SwapTotal − SwapFree) / SwapTotal × 100`. When `/proc/meminfo` is
  unreadable or there is no swap, swap is reported as unavailable and only RAM drives
  the episode. (Node's `process.memoryUsage()` — WeKan's own RSS — is recorded in the
  detail for context but is **not** the trigger; the trigger is system-wide.)

#### Start/end only — `models/lib/ramHighTracker.js`

A pure, unit-tested state machine
([models/lib/ramHighTracker.js](../../../../models/lib/ramHighTracker.js),
identical shape to `cpuHighTracker.js`) turns the sample stream into just two
events per episode, with **hysteresis** to prevent flapping:

- enter the high state after `WEKAN_RAM_HIGH_SAMPLES` (3) consecutive samples at/above
  `WEKAN_RAM_HIGH_PERCENT` (default 90% RAM used), **or** with swap at/above
  `WEKAN_SWAP_HIGH_PERCENT` (default 25% swap used) **while RAM is also** at/above
  `WEKAN_RAM_LOW_PERCENT` (default 80%);
- leave it after `WEKAN_RAM_LOW_SAMPLES` (3) consecutive samples with RAM below
  `WEKAN_RAM_LOW_PERCENT`;
- it tracks the peak RAM% and peak swap% seen during the episode for the end row.

Swap alone is not memory pressure. A machine running many programs keeps their
idle pages in swap while plenty of RAM is free; a developer laptop at RAM 52% and
swap 60% used to be reported as "high RAM usage started (>= 90%)", high severity.
Swap now counts only when RAM is tight as well, and the start row says which of
the two started it: `(RAM >= 90%)` or `(swap >= 25% with RAM >= 80%)`.

#### Report — Admin Panel → Problems → Memory usage

Episodes are written to the `eventLog` collection on the **`ram`** stream (a
`securityCategories`-style stream alongside `cpu`) through
[server/lib/ramLog.js](../../../../server/lib/ramLog.js) and
[server/lib/resourceLog.js](../../../../server/lib/resourceLog.js), and shown by the
`eventStreamReport` template in
[client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade)
(paginated, searchable, read-only). Two rows per episode:

- **start** (`detected`): `high RAM usage started (RAM >= 90%): RAM 7.4/8.0 GB (92%),
  swap 0.6/2.0 GB (30%), WeKan RSS 1.2 GB, WeKan: <activity>`
- **end** (`remediated`): `high RAM usage ended after 42s (peak RAM 96%, peak swap
  41%, back under 80%): RAM 5.1/8.0 GB (64%), swap 0.1/2.0 GB (5%), WeKan RSS 1.1 GB`

The detail is RAM, then swap (or `no swap`), then WeKan's own RSS, then the CPU
monitor's activity label when there is one. (An earlier version of this page
showed a `load …` part; the code does not write one.)

Severity: `high` when RAM is at ≥ 95% when the period starts, else `medium`. The
rows are named `HighRamUsage` (they were `RamBleed`, as if they were a
vulnerability; the old rows are renamed at startup) and carry no CWE: this is how
busy the machine is, not an attack. The end row is `info`, so it does not count as
a new problem.

Above the rows, a live line (`ramCurrentStatus`) shows the current RAM use
(percentage and used / total GB) and swap when the machine has any, refreshed every
5 seconds by the admin-only `problemDetailReport('ram')` method in
[server/methods/systemStatus.js](../../../../server/methods/systemStatus.js), which
returns `getCurrentMemory()`. The menu entry and the page title use the existing
`memory-usage` translation ("Memory usage"), so every language already has them.

### 3. Environment variables

| Variable | Default | Meaning |
|---|---|---|
| `WEKAN_RAM_MONITOR` | `true` | Master on/off. |
| `WEKAN_RAM_SAMPLE_INTERVAL_MS` | `5000` | Sampling interval (minimum 1000). |
| `WEKAN_RAM_HIGH_PERCENT` | `90` | Enter high state at/above this RAM used %. |
| `WEKAN_RAM_LOW_PERCENT` | `80` | Leave high state below this RAM used %. |
| `WEKAN_SWAP_HIGH_PERCENT` | `25` | Also enter high state at/above this swap used %, while RAM is at/above `WEKAN_RAM_LOW_PERCENT`. |
| `WEKAN_RAM_HIGH_SAMPLES` | `3` | Consecutive high samples to enter (minimum 1). |
| `WEKAN_RAM_LOW_SAMPLES` | `3` | Consecutive low samples to leave (minimum 1). |

### 4. Notes

- The tracker and the `/proc/meminfo` parser are **pure functions** unit-tested
  without Meteor, exactly like `cpuHighTracker.js` and its tests, so the enter/leave
  hysteresis and the meminfo parsing (including missing/zero swap) are covered by
  positive and negative tests.
- This is intentionally **observe-and-report only**: unlike CPU, WeKan cannot safely
  "free" RAM on demand, so there is no governor here — the value is visibility (a
  self-describing start→end record) so an operator can size the host or cap
  concurrency. See [CPU-usage](CPU-usage.md) for the governed sibling and
  [Disk-usage](Disk-usage.md) for the disk sibling.

### 5. Tests

- [tests/ramHighTracker.test.cjs](../../../../tests/ramHighTracker.test.cjs) -
  `/proc/meminfo` parsing, the used percentages and the start/end hysteresis,
  including swap without RAM pressure.
- [tests/resourceMonitorsWiring.test.cjs](../../../../tests/resourceMonitorsWiring.test.cjs) -
  the monitor is loaded, the pane and menu entry exist, the labels are
  translated, and one recorder is shared by CPU, RAM and Disk.
- [tests/resourceStreamNames.test.cjs](../../../../tests/resourceStreamNames.test.cjs) -
  the rows are named `HighRamUsage`, not like a vulnerability.

## Commits

 - [Swap alone no longer counts as high RAM usage, and the rows are renamed from RamBleed to HighRamUsage](https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523)
 - [Add the Memory Usage report with its start/end monitor and live line](https://github.com/wekan/wekan/commit/b6a3d98736ebf58ef3905613e303d091ef89f65a)
 - [First design of the RAM-usage monitor](https://github.com/wekan/wekan/commit/f306061273e12958d715452f27d19c8001925a2c)
