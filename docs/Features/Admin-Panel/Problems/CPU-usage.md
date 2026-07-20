# Design: CPU-usage monitor, governor, and Admin Panel → Problems report

Status: **Implemented** · Owner: xet7 · Related: `server/lib/cpuMonitor.js`,
`server/lib/cpuLog.js`, `models/lib/cpuHighTracker.js`, `models/eventLog.js`,
Admin Panel → Problems.

WeKan and FerretDB running on the same machine can drive CPU high enough to starve
other software. This subsystem (1) **watches** system-wide CPU and reports sustained
high-CPU periods, and (2) lets long operations **slow down** and yield when the
machine is already busy.

## 1. Requirements

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

## 2. Design

### Measurement — system-wide, includes FerretDB

`server/lib/cpuMonitor.js` samples `os.cpus()` idle/total jiffies on an interval
(`WEKAN_CPU_SAMPLE_INTERVAL_MS`, default 5s) and computes the system CPU% since the
last sample. Because it is measured across all cores at the OS level, it includes
WeKan, FerretDB, and every other process — the true "is the machine overloaded"
signal. `os.loadavg()` and the core count are recorded alongside.

### Start/end only — `models/lib/cpuHighTracker.js`

A pure, unit-tested state machine turns the sample stream into just two events per
episode. **Hysteresis** prevents flapping: it enters the high state only after
`WEKAN_CPU_HIGH_SAMPLES` (3) consecutive samples at/above `WEKAN_CPU_HIGH_PERCENT`
(85%), and leaves it only after `WEKAN_CPU_LOW_SAMPLES` (3) consecutive samples below
`WEKAN_CPU_LOW_PERCENT` (70%). On enter it records one `start` row; on leave, one
`end` row with the **duration** and **peak**.

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
noticeably lower (about -Z points)` (or `not noticeably lower`). When no governed
operation was running to slow down, the `end` row says so honestly. This keeps each
episode to at most three rows: **start**, **mitigation taken**, **end (with effect)**.

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
   other software.

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

### Report

The `cpu` value is added to `EVENT_STREAMS` (`models/eventLog.js`); the report reuses
the generic `eventStreamReport` (`stream="cpu"`) and its `eventLogPage` method, so it
gets search + pagination like Security/Speed/Tests. A "CPU usage" item is added to
the Admin Panel → Problems side menu.

## 3. Tuning (environment variables)

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
| `WEKAN_FERRETDB_SLOWDOWN_MS` | `5` | first FerretDB per-operation delay |
| `WEKAN_FERRETDB_SLOWDOWN_MAX_MS` | `200` | cap on the escalated FerretDB delay |
| `WEKAN_FERRETDB_ASK_INTERVAL_MS` | `30000` | min gap between calls to FerretDB (no log flooding) |
| `WEKAN_FERRETDB_TIMEOUT_MS` | `2000` | per-call timeout when FerretDB is unresponsive |
| `WEKAN_FERRETDB_COOLDOWN_MS` | `60000` | back-off after a failed/timed-out call, letting FerretDB recover |

FerretDB's own self-regulation is tuned on the FerretDB side with
`FERRETDB_CPU_SELF_REGULATE` (default on), `FERRETDB_CPU_HIGH_PERCENT` (85),
`FERRETDB_CPU_TARGET_PERCENT` (70), `FERRETDB_CPU_SLOWDOWN_MS` (5),
`FERRETDB_CPU_SLOWDOWN_MAX_MS` (200) and `FERRETDB_CPU_INTERVAL_MS` (5000).

## 4. Tests

- `tests/cpuHighTracker.test.cjs` — start/end thresholds, duration + peak, and the
  no-flap hysteresis (positive + negative).
- `tests/cpuMonitorWiring.test.cjs` — source guards: system-CPU sampling, start/end
  only, the `cpu` stream, the governor (`isHighCpu`/`pauseIfBusy` + batch usage), and
  the Admin Panel report wiring.
