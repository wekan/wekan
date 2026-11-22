# Design: CPU-usage monitor, governor, and Admin Panel → Problems report

> **This page uses the shared [Table Page](../../General/Table.md) design.**
> The layout, search, pagination, column spec and per-page data loading are defined
> there and are not repeated here.

Status: **Implemented** · Owner: xet7 · Related: `server/lib/cpuMonitor.js`,
`server/lib/cpuLog.js`, `models/lib/cpuHighTracker.js`, `models/eventLog.js`,
Admin Panel → Problems.

## What it is

WeKan and FerretDB running on the same machine can drive CPU high enough to starve
other software. This subsystem (1) **watches** system-wide CPU and reports sustained
high-CPU periods in Admin Panel → Problems → **CPU usage**
(`/admin/problems/cpu`), and (2) lets long operations **slow down** and yield when
the machine is already busy, and asks FerretDB to do the same.

The low-load maintenance scheduler and rolling statistics shown in Problems →
Speed are specified in
[Verified FerretDB SQLite recovery](../../../Databases/FerretDB/1/Verified-Recovery.md#low-load-scheduling-and-cpu-statistics).
CPU-intensive snapshots, checksums, migration comparisons and history audits must
use that scheduler; corruption recovery needed to make startup safe is the urgent
exception.

## Read more

- [CPU time](https://en.wikipedia.org/wiki/CPU_time) and
  [Load (computing)](https://en.wikipedia.org/wiki/Load_(computing)) on
  Wikipedia - CPU percentage and the load average shown on the live line.
- [Hysteresis](https://en.wikipedia.org/wiki/Hysteresis) on Wikipedia - why the
  start and end thresholds differ.
- [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) on
  Wikipedia - the doubling FerretDB delay.
- [Node.js `os` module](https://nodejs.org/api/os.html) - `os.cpus()` and
  `os.loadavg()`, which the sample is read from.
- [wekan/FerretDB](https://github.com/wekan/FerretDB) - the FerretDB v1 fork with
  the `throttle` command.
- WeKan: [RAM usage](RAM-usage.md) and [Disk usage](Disk-usage.md) (the sibling
  monitors), [Speed](Speed.md), [README.md](README.md).

## How to use it

**To see the CPU usage report:**

1. Open your member menu (your avatar at the top right) and click
   **Admin Panel**.
2. Click the **Problems** tab at the top.
3. In the left menu, under **Reports**, click **CPU usage**.
4. Read the live line at the top: **Current CPU usage** N%, the number of
   cores, the **load average**, min/avg/max of the recent samples and what WeKan
   is doing. It refreshes every 5 seconds.
5. Below it, the table lists past high-CPU periods: a start row, at most one
   mitigation row, and an end row with the duration, the peak and whether the
   mitigation helped. Type in the search box to filter as you type.

**To acknowledge or clear** the new CPU problems, use [Summary](Summary.md).

**To tune or turn it off**, set the environment variables in
[Tuning](#tuning-environment-variables) and restart WeKan; `WEKAN_CPU_MONITOR=false`
turns the monitor off.

## How the numbers are calculated

### Measurement — system-wide, includes FerretDB

`server/lib/cpuMonitor.js` samples `os.cpus()` idle/total jiffies on an interval
(`WEKAN_CPU_SAMPLE_INTERVAL_MS`, default 5s) and computes the system CPU% since the
last sample: `round(100 × (1 − Δidle / Δtotal))`, clamped to 0..100, where total is
user + nice + sys + idle + irq summed over every core. Because it is measured across
all cores at the OS level, it includes WeKan, FerretDB, and every other process — the
true "is the machine overloaded" signal. `os.loadavg()` and the core count are
recorded alongside.

### Start/end only — `models/lib/cpuHighTracker.js`

A pure, unit-tested state machine turns the sample stream into just two events per
episode. **Hysteresis** prevents flapping: it enters the high state only after
`WEKAN_CPU_HIGH_SAMPLES` (3) consecutive samples at/above `WEKAN_CPU_HIGH_PERCENT`
(85%), and leaves it only after `WEKAN_CPU_LOW_SAMPLES` (3) consecutive samples below
`WEKAN_CPU_LOW_PERCENT` (70%). On enter it records one `start` row; on leave, one
`end` row with the **duration** and **peak**.

- The start time is the time of the sample that completed the run of high
  samples (with the defaults, about 10 seconds after CPU first went high).
- **Duration** = end sample time − start time, shown in whole seconds.
- **Peak** = the highest sample seen while high.
- The start row's **severity** is `high` when that sample is 95% or more, else
  `medium`; end and mitigation rows are `info`, and an `info` row is not counted
  as a new problem (\#6520).

### What WeKan was doing

The `end`/`start` detail carries `system CPU X%, load a/b/c, N cores` and, when set,
a `WeKan: <activity>` label. Long operations call `cpuMonitor.setActivity('…')`
around their work (e.g. the existing-file extension corrector sets "correcting file
extensions"), so the report shows what was running during the spike.

### Governor — slow down when busy

`cpuMonitor` exports `isHighCpu()` and `pauseIfBusy(ms)`. `pauseIfBusy()` awaits a
short delay (`WEKAN_CPU_PAUSE_MS`, default 200ms) **only** while the system is in a
high-CPU period, and resolves immediately otherwise. Batch loops `await
pauseIfBusy()` between items so they yield the CPU under load without slowing the
common (idle) case. Wired into the file-extension corrector; the same helper can be
added to other batch jobs (migrations, bulk moves).

### Mitigation logging + effectiveness

During a high-CPU period, once the governor has actually paused a governed operation,
the monitor writes **one** `rate-limited` row saying what mitigation was taken —
`slowing down "<activity>" — pausing 200ms between steps to yield the CPU (this also
lowers FerretDB query load)` — and remembers the CPU% at that moment. It then tracks
the lowest CPU% seen afterwards. The `end` row reports the **effect**: `slowed down
"<activity>" (paused N times, Xs total). After slowing down, CPU went A% → B% —
noticeably lower (about -Z points)` (or `not noticeably lower`). **Noticeably** means
a drop of 10 points or more (Z = A − B ≥ 10). When no governed operation was running
to slow down, the `end` row says so honestly. This keeps each episode to at most three
rows: **start**, **mitigation taken**, **end (with effect)**.

The effect is a correlation over the sampling window (a short pause on a 5s window is
a coarse signal), reported as observed — not a controlled measurement.

### Asking FerretDB to slow down (cross-process)

FerretDB is the other big CPU user on the same host, and WeKan cannot pause
FerretDB's internal work from the outside — so the **wekan/FerretDB v1 fork adds a
general `throttle` command** (`FerretDB/internal/handler/`). When WeKan detects
high CPU it calls it (`server/lib/ferretdbGovernor.js`), which:

1. **asks what FerretDB is doing** — the response includes `commandsProcessed`, a
   running count of commands handled (higher = busier), logged as FerretDB's activity;
2. **asks FerretDB to slow down** — for `durationMs`, FerretDB pauses `slowDownMs`
   before every command in its dispatch path, lowering its CPU use and yielding to
   other software. `durationMs` is `max(3 × sample interval, 2 × ask interval)`,
   60 seconds with the defaults.

**Adaptive feedback loop (increasing delays until there is headroom).** Because
only WeKan measures the host CPU, WeKan drives the escalation and FerretDB applies
it. The first request uses a small delay (`WEKAN_FERRETDB_SLOWDOWN_MS`, default 5ms).
Then, **each sample while the system CPU is still at/above the headroom target**
(`WEKAN_CPU_TARGET_PERCENT`, default = the leave-high threshold 70%), WeKan
**doubles** the delay FerretDB adds between operations — 5 → 10 → 20 → … up to
`WEKAN_FERRETDB_SLOWDOWN_MAX_MS` (default 200ms). As soon as CPU **drops below the
target** (enough CPU is free for other processes), WeKan stops escalating and just
**holds** the current delay. Every step is written to the CPU usage log:

- each increase — `CPU still X% (target < 70%): increased FerretDB slow-down A → B ms`;
- success — `CPU dropped to X% (< target 70%) after slowing FerretDB to B ms/op —
  enough CPU is now free for other processes`;
- the honest failure case — if even the maximum delay does not free enough CPU, one
  `slowing FerretDB did not free enough CPU — the load is (partly) elsewhere` line, so
  the admin knows FerretDB was not the culprit.

The throttle **self-expires** on the FerretDB side (max 5 min), so a WeKan crash can
never leave FerretDB permanently slow. On plain MongoDB or an older FerretDB without
the command, the call fails once and is never retried (best-effort, no effect).

**FerretDB self-regulates too (so it works even if WeKan is starved).** WeKan can
only measure the host CPU and send requests if it has CPU time itself — which it may
not, under load. So FerretDB **also** samples the host CPU (`/proc/stat`) on its own
and, when it is too high, adds an increasing delay before each command until CPU
recovers, independent of WeKan. The delay FerretDB applies is `max(WeKan-requested,
FerretDB-self-regulated)`. WeKan reads FerretDB's `autoSlowDownMs` and `hostCpuPercent`
from the throttle response and includes them in the log, and FerretDB also returns an
`operationsSummary` (its busiest commands, e.g. `find=12000, update=340, …`) so the
log shows what FerretDB was doing.

**WeKan does not flood the log or hammer FerretDB.** WeKan still samples CPU locally
every `WEKAN_CPU_SAMPLE_INTERVAL_MS`, but it only **talks to FerretDB at most once per
`WEKAN_FERRETDB_ASK_INTERVAL_MS`** (default 30 s) — FerretDB self-regulates in
between. Every call has a **timeout** (`WEKAN_FERRETDB_TIMEOUT_MS`, default 2 s); if
FerretDB does not answer, WeKan records the moment it **became unresponsive**, then
**backs off** for `WEKAN_FERRETDB_COOLDOWN_MS` (default 60 s) instead of retrying, so
it lets FerretDB recover. When FerretDB answers again, WeKan writes one recovery row
with the full **unresponsive span (start → end)**, the current CPU, and FerretDB's
status + operations summary.

### FerretDB pegging a few cores (\#6480)

System-wide CPU% hides one process using a few cores of a many-core host: FerretDB at
300% (3 cores) is only 75% system-wide on a 4-core machine, under the 85% threshold.
So while the system is **not** high but at or above `WEKAN_FERRETDB_WATCH_PERCENT`
(60%), WeKan asks FerretDB for its own process CPU with a pure status read
(`slowDownMs 0`, which never slows FerretDB down), at most once per ask interval.
When FerretDB's process CPU is at or above `WEKAN_FERRETDB_PROC_HIGH_PERCENT`
(150%, where 100% = one core), one start row is written (`high` when it is at least
90% × the core count, else `medium`), and one end row when it drops back.

### Rolling statistics and low-load leases

The monitor also retains a bounded rolling sample window (720 samples by default,
`WEKAN_CPU_STATS_SAMPLES`, at least 12 — one hour at the default 5 s interval)
and exposes minimum, average (rounded mean), maximum, sample count and the time of
the lowest sample in both Problems → Speed and Problems → CPU usage. With no
samples yet, all three show the last reading and the count is 0. `runWhenCpuLow()`
grants one heavy maintenance lease only after `WEKAN_MAINTENANCE_LOW_SAMPLES` (3)
consecutive samples below the leave-high threshold; another job waits, and a job
whose window never arrives before its maximum wait (30 minutes by default) is
deferred. The current activity label and existing governor remain active
throughout the lease.

### Tuning (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `WEKAN_CPU_MONITOR` | `true` | set `false` to disable the monitor entirely |
| `WEKAN_CPU_SAMPLE_INTERVAL_MS` | `5000` | sampling interval |
| `WEKAN_CPU_HIGH_PERCENT` | `85` | enter-high threshold |
| `WEKAN_CPU_LOW_PERCENT` | `70` | leave-high threshold (hysteresis) |
| `WEKAN_CPU_HIGH_SAMPLES` | `3` | consecutive high samples before a `start` |
| `WEKAN_CPU_LOW_SAMPLES` | `3` | consecutive low samples before an `end` |
| `WEKAN_CPU_PAUSE_MS` | `200` | governor pause length while busy |
| `WEKAN_CPU_TARGET_PERCENT` | `70` | headroom target — escalate FerretDB's delay until CPU drops below this |
| `WEKAN_CPU_STATS_SAMPLES` | `720` | rolling statistics window (minimum 12) |
| `WEKAN_MAINTENANCE_LOW_SAMPLES` | `3` | consecutive low samples before a maintenance lease |
| `WEKAN_FERRETDB_SLOWDOWN_MS` | `5` | first FerretDB per-operation delay |
| `WEKAN_FERRETDB_SLOWDOWN_MAX_MS` | `200` | cap on the escalated FerretDB delay |
| `WEKAN_FERRETDB_ASK_INTERVAL_MS` | `30000` | min gap between calls to FerretDB (no log flooding) |
| `WEKAN_FERRETDB_TIMEOUT_MS` | `2000` | per-call timeout when FerretDB is unresponsive |
| `WEKAN_FERRETDB_COOLDOWN_MS` | `60000` | back-off after a failed/timed-out call, letting FerretDB recover |
| `WEKAN_FERRETDB_WATCH_PERCENT` | `60` | system CPU at which FerretDB's own process CPU is watched |
| `WEKAN_FERRETDB_PROC_HIGH_PERCENT` | `150` | FerretDB process CPU (100% = one core) that opens an episode |

FerretDB's own self-regulation is tuned on the FerretDB side with
`FERRETDB_CPU_SELF_REGULATE` (default on), `FERRETDB_CPU_HIGH_PERCENT` (85),
`FERRETDB_CPU_TARGET_PERCENT` (70), `FERRETDB_CPU_SLOWDOWN_MS` (5),
`FERRETDB_CPU_SLOWDOWN_MAX_MS` (200) and `FERRETDB_CPU_INTERVAL_MS` (5000).

## How it works in WeKan

The `cpu` value is in `EVENT_STREAMS` (`models/eventLog.js`); the report reuses
the generic `eventStreamReport` (`stream="cpu"`) and its admin-only `eventLogPage`
method, so it gets search + pagination like Security/Speed/Tests. The "CPU usage"
item (`report-cpu`) is in the Admin Panel → Problems side menu. Rows are written
through the shared fold, so a repeated problem is one row with a count, and are
deleted after `EVENTLOG_RETENTION_DAYS` (default 90).

| File | What it does |
| --- | --- |
| [server/lib/cpuMonitor.js](../../../../server/lib/cpuMonitor.js) | sampling, the tracker, the governor, the FerretDB loop, statistics, `runWhenCpuLow` |
| [models/lib/cpuHighTracker.js](../../../../models/lib/cpuHighTracker.js) | the pure start/end state machine |
| [server/lib/cpuLog.js](../../../../server/lib/cpuLog.js) | writes the `cpu` stream |
| [server/lib/ferretdbGovernor.js](../../../../server/lib/ferretdbGovernor.js) | the `throttle` command calls, timeout and cooldown |
| [models/eventLog.js](../../../../models/eventLog.js) | `EVENT_STREAMS`, `eventLogPage`, `eventLogCount` |
| [client/components/settings/adminProblems.js](../../../../client/components/settings/adminProblems.js) | the menu entry, `eventStreamReport`, `cpuStatus` and the 5-second refresh |
| [client/components/settings/adminProblems.jade](../../../../client/components/settings/adminProblems.jade) | the `cpuCurrentStatus` live line |

### Requirements this was built to

1. While WeKan (and FerretDB alongside it) run, watch that CPU usage does not go too
   high; if it does, **slow down** — put pauses between operations so other software
   can still run.
2. Add an **Admin Panel → Problems → CPU usage** report listing high-CPU periods and
   what WeKan/FerretDB were doing at the time.
3. Record **only the START and END** of each high-CPU period, so the report never
   floods with rows.
4. When CPU is high, also write **what automatic mitigation was taken** (e.g. slowing
   down the current WeKan/FerretDB operation) and **whether it helped noticeably** —
   i.e. when WeKan/FerretDB pauses, does CPU usage actually go lower.

### Tests

- [tests/cpuHighTracker.test.cjs](../../../../tests/cpuHighTracker.test.cjs) —
  start/end thresholds, duration + peak, and the no-flap hysteresis (positive +
  negative).
- [tests/cpuMonitorWiring.test.cjs](../../../../tests/cpuMonitorWiring.test.cjs) —
  source guards: system-CPU sampling, start/end only, the `cpu` stream, the
  governor (`isHighCpu`/`pauseIfBusy` + batch usage), and the Admin Panel report
  wiring.
- [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs) — this page
  links the shared Table Page design.

## Commits

 - [Swap alone is not high usage, and resource monitors are not named like vulnerabilities](https://github.com/wekan/wekan/commit/cfd9a62466a64b58d514d46c3c6560f003704523)
 - [Rolling CPU statistics and the low-load maintenance scheduler](https://github.com/wekan/wekan/commit/506c2697a009a66264a86eafbb861a05f35bfbf6)
 - [Do not throttle FerretDB when it is only busy](https://github.com/wekan/wekan/commit/c1522ad2a617dd5bd1a6edf9f53eaba4707ee965)
 - [One active pane for the Problems page](https://github.com/wekan/wekan/commit/760bd090440963b92d1b3062fe08bc780621bfe3)
 - [The route and the template say what the menu says](https://github.com/wekan/wekan/commit/fa289e4a4de8d4411cfbbd984bae4b184d1eb3c7)
 - [Move this implemented design into docs/Features](https://github.com/wekan/wekan/commit/daaf5639107f19235c0142b9db1565706e622b8b)
 - [Render the Problems side menu from the shared left menu](https://github.com/wekan/wekan/commit/f46aab011b7c1e319fe0c1f97ef155e66b615fa6)
 - [Show the current CPU usage line](https://github.com/wekan/wekan/commit/f04c48451875ef287add315025f3d6d9b9b0a762)
 - [Surface FerretDB's process CPU, so a core-peg shows (#6480)](https://github.com/wekan/wekan/commit/4206ff4e71ff64183bf247be9b95b559a2495b83)
 - [Adaptive feedback loop, FerretDB self-regulation and robust asks](https://github.com/wekan/wekan/commit/7707736f9652152f685e32fff811a884526ca590)
 - [Use FerretDB's general throttle command name](https://github.com/wekan/wekan/commit/8d2fa1e53063d92be58a41807b9067cec9ac750e)
 - [On high CPU, ask FerretDB what it is doing and to slow down](https://github.com/wekan/wekan/commit/ee0aa29a17e135c125cccb1afbd122466df6a2f8)
 - [Log the automatic mitigation and whether it helped](https://github.com/wekan/wekan/commit/82cc884f0312103b4e193c91a226a1011719715f)
 - [CPU-usage monitor, governor and the CPU usage report](https://github.com/wekan/wekan/commit/1c636f09b35eb48f777bef847f4df5f40c0df969)
