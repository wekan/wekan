# Profiling grain startup

For server startup attribution, run the same launchers, bundle and database
locally. You do not need a running Sandstorm service. `meteor run` follows a
different launch path. An actual grain is needed only to measure Sandstorm's
own overhead and the complete browser/login path.

## Local run with the same server code paths

On Linux with `bwrap` (Bubblewrap) installed:

```sh
mkdir -p .tools/tmp
export TMPDIR="$PWD/.tools/tmp"
node scripts/profile-sandstorm-startup.cjs \
  /path/to/bundle /path/to/meteor-spk.deps .tools/tmp/startup-profile
```

Supply a built Meteor bundle with installed server dependencies and the deps
directory containing the matching `bin/node` and `ferretdb`. Prefer a production
bundle for representative results; `.meteor/local/build` can investigate code
paths but has development-build differences. The runner reads the manifest's
environment, uses its Sandstorm flags and transport, and enables both profilers.
It runs the actual memory wrapper and launcher, which start FerretDB and Meteor.
It bypasses only `/sandstorm-http-bridge` and Sandstorm's supervisor.

Bubblewrap maps `WORKDIR/var` to `/var` and `WORKDIR/tmp` to `/tmp`, while the
rest of the filesystem is read-only. This preserves the launchers' hardcoded
grain paths without writing to the host's `/var`. Keep bundle, deps and WORKDIR
outside the host's `/var` and `/tmp`, which are hidden by these mappings.
Ports 4000, 4001, 4003 and 4004 must be free. HTTP binds to loopback. Stop the
run with Ctrl-C; repeat the command to measure a resume with the same test data.
Use a new WORKDIR for a fresh database, or put a **copy** of an existing grain's
`/var` contents in `WORKDIR/var` while stopped to measure that data's startup.

Bundle and deps trees are symlinked, not copied, so reads still reach their
original filesystem. Put them on the slow filesystem being investigated.
The runner copies only the small current launcher sources into its staging
directory. It uses host libraries and host memory detection, so those can differ
from a grain. It does not simulate Sandstorm identity headers or the Cap'n Proto
API: use it through `meteor-listening`, not as a test of board login or Powerbox.
User namespaces must be allowed for Bubblewrap; there is no unsafe fallback that
runs the launchers against the host's real `/var`.

## Actual grain comparison

For a full end-to-end comparison, measure a stopped grain opening through
Sandstorm. A browser refresh of an already running grain is not a new start.

The command in `sandstorm-pkgdef.capnp` is used for both new and resumed grains:

```text
/sandstorm-http-bridge 4000 -- node start-memory.js
  -> node start.js
  -> migration check, FerretDB, bundled main.js
  -> Meteor packages and startup hooks
  -> HTTP listening
  -> browser assets, Sandstorm login, subscriptions, board rendering
```

Root `sandstorm.js` and `server/sandstorm.js` load as part of the app. Keep the
manifest's command, Sandstorm settings, database and memory wrapper intact.

## Enable and collect

The package definition enables lightweight startup markers. For detailed Meteor
profiling, add the second entry to its `environ` explicitly:

```capnp
(key = "WEKAN_STARTUP_TIMING", value = "1"),
(key = "METEOR_PROFILE", value = "10"),
```

The manifest defines the entire app environment. Exporting these variables in
the host shell alone does not set them inside the grain. Rebuild the deps and
package using the existing Sandstorm build workflow; `build-deps.sh` copies the
timing helper alongside the launchers. Install the diagnostic package on a test
Sandstorm instance and open a stopped test grain. Preserve the complete grain
debug log from startup through the first usable board. For an existing grain,
use a backup restored into the test instance to reproduce its data-dependent
startup work. See [the packaging design](Meteor3/Migration.md#9-build--ci).

Remove any diagnostic environment entries and rebuild to disable them. The
default package omits `METEOR_PROFILE` because its stack capture adds substantial
startup overhead; the local profiling runner still enables it explicitly. Setting
`METEOR_PROFILE` to `0` still enables it: the number is a reporting threshold in
milliseconds. Profiling adds overhead; compare runs using the same settings,
then verify conclusions with diagnostics disabled.

## Read the timeline

`[sandstorm-startup]` JSON records contain a component, event and PID:

- `elapsedMs`: monotonic time since the memory wrapper initialized diagnostics,
  shared with the launcher child.
- `deltaMs`: wall time since the previous marker in this component.
- `cpuUserMs` and `cpuSystemMs`: CPU consumed by this process during that interval.
  These do not include FerretDB or other child processes.

The first marker is after Node has loaded the helper. Sandstorm scheduling,
sandbox setup, the HTTP bridge and initial Node executable loading precede it;
capture the user action and host-side process start times to measure those costs.

| Events | Interpretation |
| --- | --- |
| Wrapper `launcher-spawn` to launcher `entry` | Child Node startup and helper loading |
| `entry` to `directories-ready` | Launcher initialization and writable directory checks |
| `migration-check-start` to `migration-check-complete` | Migration decision plus any one-time migration; individual migration start/end markers identify that case |
| `ferretdb-spawn` to `ferretdb-listening` | Database launch until its loopback TCP socket accepts a connection; retries every 50 ms, with a 30-second deadline |
| `ferretdb-listening` to `meteor-load-start` | Immediate handoff to Meteor; there is no fixed sleep |
| `meteor-load-start` to `meteor-listen-requested` | Bundle loading and awaited Meteor initialization |
| `meteor-listen-requested` to `meteor-listening` | Please-wait bridge shutdown and app socket binding |

`meteor-require-returned` marks the synchronous return from `require('./main.js')`;
Meteor's asynchronous boot can still be running. It must not be treated as ready.
Use elapsed-time subtraction between named events when intervening markers exist.

Meteor's profiler prints `Load server bundles`, `Call Meteor.startup hooks`, and
`Run main()` with nested package/hook timings. Awaited hooks include database wait
time. The app wraps many callbacks in `00startupResilience.js`, so some hook labels
can share that registration site. Nested durations overlap: do not sum parents
and children. The generated boot code also loads source maps before its profiling
block; the outer launcher interval includes this otherwise unreported cost.

Correlate FerretDB's own startup log with the timeline. A ready socket is weaker
evidence than a successful database command. The app's database wait hook and
index/migration hooks may account for time after FerretDB starts listening.

## Test the storage hypothesis

Early development-bundle experiments used a Reify bypass for standalone
`server-rspack.cjs` and a persistent `METEOR_REIFY_CACHE_DIR`. Neither is shipped:
the production app is embedded in Meteor's `app/app.js`, so the bypass did not
apply, and no meaningful production benefit was measured for the cache.
The development results (roughly 9.3 to 3.9 seconds) must not be attributed to
production. The bypass helper and its tests have been removed; Meteor uses its
normal runtime loader and default cache behavior.

The retained improvements are database-listener readiness and the held browser
readiness request. Detailed Meteor profiling
is opt-in. Source maps remain enabled. See the production measurements below.

To list file accesses and read sizes without recording read buffers, start the
same local runner under `strace` and stop it after `meteor-listening`:

```sh
mkdir -p .tools/tmp/startup-strace
export TMPDIR="$PWD/.tools/tmp"
strace -ff -ttt -T -yy -s 200 -I 1 --kill-on-exit \
  -e trace=%file,read,pread64,close,mmap -e raw=read,pread64 \
  -o .tools/tmp/startup-strace/trace \
  node scripts/profile-sandstorm-startup.cjs \
    /path/to/bundle /path/to/meteor-spk.deps .tools/tmp/startup-profile
```

`-ff` separates host process/thread IDs; find the launcher's `execve` of `start.js`
to distinguish it from the wrapper and FerretDB. `-T` gives syscall durations,
`-yy` identifies opened paths, and raw read arguments avoid logging file contents.
Raw read file descriptors must be mapped to their corresponding successful open
calls. The trace includes failed resolution probes as well as successful reads.
Do not sum overlapping thread durations as elapsed startup time.

In that local run, the Node process read about 267 MB, including two reads of the
roughly 105.5 MB development server bundle and one of its 33.5 MB source map.
There were about 9,000 `statx` calls. Actual storage `read_bytes` stayed zero and
traced reads took about 69 ms: the files were cached. A CPU profile attributed
much of the delay to Reify's syntax-tree traversal. Enabling the Reify cache left
the byte count almost unchanged while sharply reducing CPU time. This identifies
a repeated compiler cost without disproving an additional cold-storage problem.

Record the package version, grain data size, host/filesystem, whether this is the
first start after an upgrade, and whether the host's file cache is likely warm.
Compare several stopped-grain starts with the same package and data. Separate
one-time migration runs from ordinary resumes. A faster second run supports a
cache-related hypothesis, but does not prove storage is the only cause.

From the host, sample CPU and `/proc/<host-pid>/io` for **both** Node and FerretDB
during the same intervals. Grain-log PIDs may be namespace PIDs: map them to host
PIDs before sampling. `rchar`/`syscr` describe read calls, including cached reads;
`read_bytes` is storage I/O accounting, with filesystem-dependent limitations.
See [Linux proc documentation](https://www.kernel.org/doc/html/latest/filesystems/proc.html).
Metadata lookups, mmap faults and network filesystems need additional evidence.

For a controlled reproduction, host-side syscall tracing of the grain processes
can expose slow open/stat/read calls, and host disk statistics can show storage
latency. Trace from launch when possible; attaching later misses early reads.
Tracing itself changes performance, so use it to attribute a delay already seen
in ordinary timing logs, not as the baseline benchmark.

High Node CPU during bundle loading suggests parsing/evaluation; low Node CPU
alone does not prove disk waiting (database work, timers and scheduling also
produce it). Correlate storage activity and latency with the slow interval.

Finally, capture a browser network/performance trace of opening the grain. Server
`meteor-listening` is not board readiness: assets, DDP login, subscription readiness
and rendering follow the waiting-page handoff.
Record those browser milestones separately; browser and server monotonic clocks
have different origins.

## Production measurements and browser handoff

The production benchmark uses `meteor build .build --directory --architecture
os.linux.x86_64`, then `meteor npm install` in `bundle/programs/server`, the same
build stages used by `meteor-spk`. For the installable test payload, the release
workflow's `bundle-trim.mjs`, `prune-unreachable-npm.mjs`, and
`prune-build-only-modules.mjs` run before `spk pack`. Packing directly preserves
that already-built, trimmed payload instead of rebuilding it.

Measured with Meteor 3.6-rc.0, Node v26.11.1 and FerretDB v1.93.0, using a fresh
test database and then its persisted state, with profiling enabled:

| Payload | First start | Resume |
| --- | ---: | ---: |
| Untrimmed production bundle | 3.50 s | 3.25 s |
| Trimmed production payload, local runner | 3.72 s | 3.41 s |
| Unpacked test SPK as a read-only root, only packaged libraries | 3.73 s | 3.32 s |

These are individual warm-host-cache measurements, not cold-storage benchmarks
or timings inside an actual Sandstorm grain. Production embeds about 130 MiB of
app code into `app/app.js`. Its resumed isolated run spent 3.05 seconds loading
bundles (1.96 seconds in the embedded Rspack module) and 133 ms in startup hooks.
Removing standalone maps does not remove all embedded/inline maps. The earlier
1.49-second hidden-map experiment used a different development layout and did
not predict the production result. The large redundant Reify pass diagnosed
earlier belonged to that development layout, not the embedded production app.

The waiting page previously reloaded every five seconds, potentially adding
almost five seconds after server readiness. It now fetches
`/.sandstorm-startup-ready` immediately and holds the request. The launcher asks
the bridge to close its listening socket while retaining active requests, binds
Meteor, then signals the bridge to return HTTP 204. The browser reloads its current
URL only on that response. The app also serves 204 on that endpoint for requests
reconnecting after handoff. The isolated production test observed the held
response 2 ms after the server's listening marker.

Disconnected requests retry after 250 ms; requests held for 25 seconds expire and
reconnect. JavaScript-disabled clients retain the five-second meta refresh. During
legacy data migration, the separate importer dashboard still refreshes every two
seconds and checks its handoff every 1.5 seconds. Sandstorm login starts its HTTP
rendezvous 10 ms after DDP connects and retries failed requests after one second;
that is separate from discovering HTTP readiness. No browser automation was run
for these measurements. HTTP integration and waiting-page JavaScript tests cover
the successful handoff and reconnect behavior.


### Production CPU profile: eager source-map processing

A CPU profile of the unpacked production SPK, using Meteor's
`METEOR_INSPECT="Load server bundles"` and
`METEOR_INSPECT_OUTPUT=/var/profiles`, identifies source-map processing as a
large part of the apparent Rspack module load time. These flags write a Chrome
DevTools-compatible `.cpuprofile` inside the runner's writable `var/profiles`.
Keep the lightweight `WEKAN_STARTUP_TIMING=1` markers for readiness measurements.

With `METEOR_PROFILE=10`, a 3.265-second bundle-loading CPU sample contained
about 1.725 seconds beneath source-map stack formatting, triggered by
`Meteor.startup` registration. Meteor captures a caller stack for each hook when
this flag is nonempty. This is diagnostic overhead, not hook execution time.
The same sample contained about 581 ms in `vm.Script` compilation and 201 ms of
GC; these are sampled costs, not additional independently measured phases.

Clearing `METEOR_PROFILE` does not eliminate source-map work. A second CPU
profile found about 1.279 seconds beneath Bluebird's `setBounds`, which reads
error stacks during initialization. That forces the embedded app's large source
map to be decoded and sorted. The installed dependency graph is
`unzipper@0.12.5 -> bluebird@3.7.2`; the app uses unzipper directly and through
`@wekanteam/exceljs@4.7.4`. Eager imports include backup code and Excel workbook
helpers. Bluebird uses these initialization stacks to establish internal frame
bounds, even without Meteor's timing profiler.

A diagnostic overlay of a **copy** of the packaged `boot.js` configured
source-map-support with a null-returning `retrieveSourceMap` and
`overrideRetrieveSourceMap: true`. With both Meteor profilers disabled, HTTP
readiness was 1.489 seconds with the overlay versus 2.956 seconds with the
unchanged production payload. Both used the same persisted test database and
isolated packaged root. These are single warm-cache measurements, not grain or
cold-storage benchmarks. The overlay is not a shipped fix: disabling source maps
would reduce the usefulness of real error traces.

The next optimization target is eager ZIP/Excel initialization, not additional
startup-hook timing. Defer those dependencies until their features are used, or
remove Bluebird's unnecessary stack initialization while preserving error mapping.
Simply aliasing Bluebird to native Promise is unsafe: unzipper uses its `props`,
`map`, and `mapSeries` APIs. Any dependency change needs archive/import/export
coverage and a rebuilt production measurement; moving this work to first use
also means that first operation may incur the deferred cost.
