// ============================================================================
// Unexpected outcomes: crashes, downtime, and errors nobody caught
// (design: docs/Security/Remediation/WeKan.md §13.4)
// ----------------------------------------------------------------------------
// Admin Panel / Problems answers "what did WeKan refuse" and "what did the
// database say". It did not answer the plainest question of all: did this server
// stop, and did it stop cleanly?
//
// A crash leaves nothing behind. The process is gone, so it cannot write a
// message about being gone - which is why a heartbeat is the only thing that
// works: WeKan writes the time every minute, and the NEXT start reads it. A gap
// between the last heartbeat and the new start is downtime, and a last heartbeat
// with no clean-shutdown mark beside it is a crash rather than a restart.
//
// Two more things land here, because they are the same question one level down:
// an uncaught exception and an unhandled promise rejection. Meteor turns the
// second into a process exit in this app, so it is a crash with a cause
// attached - and the cause is worth recording before the process goes.
//
// Best-effort throughout, and never in the way: everything is wrapped, and the
// heartbeat is one small upsert a minute.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import EventLog from '/models/eventLog';
import { IntegrityKeys } from '/models/fileIntegrity';

const { sanitizeDetail } = require('/models/lib/securityLogFormat');

const HEARTBEAT_MS = 60 * 1000;
// A gap longer than two heartbeats is a real gap rather than a slow write.
const DOWNTIME_THRESHOLD_MS = 3 * HEARTBEAT_MS;

function record(evt) {
  try {
    const p = EventLog.insertAsync({
      stream: 'integrity',
      at: new Date(),
      severity: evt.severity || 'medium',
      category: evt.category || 'availability',
      bleed: evt.bleed || 'DowntimeBleed',
      action: evt.action || 'detected',
      source: evt.source || 'uptime',
      detail: sanitizeDetail(evt.detail),
      count: 1,
    });
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('uptime record failed:', e && e.message);
  }
}

/**
 * Read the previous run's last heartbeat and say what it means. Pure enough to
 * be worth keeping separate: given two timestamps and a flag, this is the whole
 * decision, and tests/fileIntegrity.test.cjs drives it directly.
 *
 * @param {object} previous the stored heartbeat document, or null on a first run
 * @param {number} nowMs
 * @return {{kind: 'first-run'|'clean'|'restart'|'crash', downMs: number, detail: string}}
 */
export function classifyPreviousRun(previous, nowMs) {
  if (!previous || !previous.at) {
    return { kind: 'first-run', downMs: 0, detail: 'no previous run recorded' };
  }

  const last = new Date(previous.at).getTime();
  const downMs = Math.max(0, Number(nowMs) - last);
  const minutes = Math.round(downMs / 60000);

  if (previous.cleanShutdown) {
    return {
      kind: 'clean',
      downMs,
      detail: `stopped cleanly; down for about ${minutes} minute(s)`,
    };
  }

  if (downMs < DOWNTIME_THRESHOLD_MS) {
    // Short, and no clean-shutdown mark: a restart quick enough that the
    // shutdown hook may simply not have run. Worth a note, not an alarm.
    return {
      kind: 'restart',
      downMs,
      detail: `restarted without a clean-shutdown mark; down for about ${minutes} minute(s)`,
    };
  }

  return {
    kind: 'crash',
    downMs,
    detail:
      `the previous run STOPPED WITHOUT SHUTTING DOWN CLEANLY, and this server ` +
      `was down for about ${minutes} minute(s)`,
  };
}

const SEVERITY_OF = {
  'first-run': 'info',
  clean: 'info',
  restart: 'low',
  crash: 'high',
};

if (Meteor.isServer) {
  Meteor.startup(async () => {
    try {
      const previous = await IntegrityKeys.findOneAsync({ _id: 'heartbeat' });
      const verdict = classifyPreviousRun(previous, Date.now());

      // A clean stop and a first run are not problems; recording them would put
      // a row in Problems on every deliberate restart, and a page that cries
      // wolf is a page nobody opens.
      if (verdict.kind === 'crash' || verdict.kind === 'restart') {
        record({
          severity: SEVERITY_OF[verdict.kind],
          category: 'availability',
          action: verdict.kind === 'crash' ? 'failed' : 'detected',
          source: 'uptime',
          detail: verdict.detail,
        });
      }

      await IntegrityKeys.upsertAsync(
        { _id: 'heartbeat' },
        { $set: { at: new Date(), cleanShutdown: false, pid: process.pid } },
      );
    } catch (e) {
      if (process.env.DEBUG === 'true') console.warn('uptime startup check failed:', e && e.message);
    }

    Meteor.setInterval(() => {
      try {
        const p = IntegrityKeys.upsertAsync(
          { _id: 'heartbeat' },
          { $set: { at: new Date(), cleanShutdown: false, pid: process.pid } },
        );
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) { /* a heartbeat that fails must not take the timer down */ }
    }, HEARTBEAT_MS);

    // A clean stop marks itself, which is the only way the next start can tell
    // the difference between "stopped" and "died".
    //
    // Two things were wrong here, and together they made every ordinary restart
    // look like a crash - which is what an admin's Filesystem integrity page was
    // full of: "the previous run STOPPED WITHOUT SHUTTING DOWN CLEANLY, and this
    // server was down for about 4 minute(s)", severity high, on a snap that had
    // simply been refreshed.
    //
    //   1. `IntegrityKeys.update()` is not synchronous in Meteor 3. It starts a
    //      write and returns a promise nobody waited for, so the process was
    //      killed with the mark unwritten. Every stop was an unclean stop.
    //   2. Worse: registering ANY listener for SIGTERM replaces Node's default
    //      behaviour, which is to terminate. Nothing here exited, so WeKan
    //      ignored SIGTERM entirely - systemd/snapd then waited out its stop
    //      timeout and used SIGKILL, which is both the minutes of "downtime"
    //      those rows reported and a genuinely unclean kill of the app.
    //
    // So: write the mark, then exit, and exit even if the write cannot be made.
    // A shutdown must never be held open by the bookkeeping about shutdowns.
    const MARK_TIMEOUT_MS = 2000;
    let stopping = false;
    const markCleanAndExit = () => {
      if (stopping) return;
      stopping = true;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        // 0, not 128+15: a stop that was asked for is a success, and a non-zero
        // code makes systemd mark the service failed on every restart.
        process.exit(0);
      };
      const timer = setTimeout(finish, MARK_TIMEOUT_MS);
      if (typeof timer.unref === 'function') timer.unref();
      Promise.resolve()
        .then(() =>
          IntegrityKeys.updateAsync(
            { _id: 'heartbeat' },
            { $set: { at: new Date(), cleanShutdown: true } },
          ),
        )
        .catch(() => { /* nothing useful to do while exiting */ })
        .then(() => {
          clearTimeout(timer);
          finish();
        });
    };
    process.once('SIGTERM', markCleanAndExit);
    process.once('SIGINT', markCleanAndExit);

    // The cause, recorded before the process goes. Listeners are ADDED, never
    // replaced: removing whatever else is listening would change how the app
    // handles its own failures.
    process.on('uncaughtException', error => {
      record({
        severity: 'critical',
        category: 'crash',
        bleed: 'CrashBleed',
        action: 'failed',
        source: 'uncaughtException',
        detail: (error && error.message) || String(error),
      });
    });

    process.on('unhandledRejection', reason => {
      record({
        severity: 'critical',
        category: 'crash',
        bleed: 'CrashBleed',
        action: 'failed',
        source: 'unhandledRejection',
        detail: (reason && reason.message) || String(reason),
      });
    });
  });
}

export default { classifyPreviousRun };
