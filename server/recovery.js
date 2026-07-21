import fs from 'fs';
import path from 'path';
import RecoveryEvents from '/models/recoveryEvents';
import RecoveryStatus from '/models/recoveryStatus';
import { parseRecoveryEventsJsonl } from '/models/lib/recoveryEventsJsonl';

// #6492 Recovery / Remediation bridge.
//
// The reliable data-safety detection and action happen where they can: FerretDB
// (quick_check + auto-VACUUM on open) and the startup scripts (rotating backup,
// restore-from-backup, re-migrate) — the SQLite files are only safe to touch there,
// while FerretDB is stopped. Those steps append one JSON object per line to a
// "recovery-events.jsonl" file in the SQLite data dir. On startup the WeKan server
// imports any not-yet-seen lines into the recoveryEvents collection so the whole
// remediation history shows up in Admin Panel / Problems / Recovery.
//
// The JSONL parser is a pure function in /models/lib/recoveryEventsJsonl (unit tested).

// recoveryEventsFilePath returns where the startup scripts write the JSONL log, from
// the same env the scripts use for the SQLite data dir, or null if unknown.
export function recoveryEventsFilePath(env = process.env) {
  const dir = env.WEKAN_FERRETDB_SQLITE_DIR || env.FERRETDB_SQLITE_DIR || env.WEKAN_SQLITE_DIR;
  return dir ? path.join(dir, 'recovery-events.jsonl') : null;
}

// importRecoveryEventsFromFile reads the JSONL log and inserts events created after
// the last import (tracked by a marker stored on the recoveryEvents collection's
// meta). Best-effort: any failure is logged, never thrown.
async function importRecoveryEventsFromFile() {
  const file = recoveryEventsFilePath();
  if (!file) {
    return;
  }

  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    return; // no file yet (nothing to import)
  }

  const events = parseRecoveryEventsJsonl(text);
  if (events.length === 0) {
    return;
  }

  // Only import events newer than the newest one already recorded from this source,
  // so restarts do not duplicate the whole file.
  const last = await RecoveryEvents.findOne(
    { source: { $ne: 'manual' } },
    { sort: { createdAt: -1 }, fields: { createdAt: 1 } },
  );
  const lastAt = last && last.createdAt ? last.createdAt.getTime() : 0;

  for (const ev of events) {
    const at = ev.ts ? Date.parse(ev.ts) : NaN;
    if (Number.isFinite(at) && at <= lastAt) {
      continue;
    }

    await RecoveryEvents.record(ev.type, {
      db: ev.db,
      detail: ev.detail,
      severity: ev.severity,
      source: ev.source,
    });
  }
}

// recoveryInProgressMarkerPath: the marker the startup scripts write while a restore or
// re-migration is running; its presence at startup means recovery is (or just was) in
// progress, so the maintenance spinner is shown until the database is confirmed healthy.
export function recoveryInProgressMarkerPath(env = process.env) {
  const dir = env.WEKAN_FERRETDB_SQLITE_DIR || env.FERRETDB_SQLITE_DIR || env.WEKAN_SQLITE_DIR;
  return dir ? path.join(dir, 'RECOVERY_IN_PROGRESS') : null;
}

// probeDatabaseHealthy: a cheap, best-effort read that a broken database fails. Returns
// true when the database serves a basic query.
async function probeDatabaseHealthy() {
  try {
    const Settings = require('/models/settings').default;
    await Settings.find({}, { fields: { _id: 1 }, limit: 1 }).fetchAsync();
    return true;
  } catch (e) {
    return false;
  }
}

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // Import any recovery events the startup scripts logged.
    await importRecoveryEventsFromFile().catch(() => {});

    // If a recovery was in progress (marker present), keep the maintenance spinner up
    // until we confirm the database serves reads, then clear it. If it still cannot
    // serve reads, leave the spinner on and flag that manual recovery is required.
    let marker = null;
    try {
      marker = recoveryInProgressMarkerPath();
    } catch (e) {
      marker = null;
    }

    let inProgress = false;
    try {
      inProgress = !!marker && fs.existsSync(marker);
    } catch (e) {
      inProgress = false;
    }

    if (!inProgress) {
      await RecoveryStatus.setMaintenance(false, '');
      return;
    }

    await RecoveryStatus.setMaintenance(true, 'Recovering data, please wait…');

    if (await probeDatabaseHealthy()) {
      await RecoveryEvents.record(RecoveryEvents.types.INTEGRITY_OK, {
        db: 'wekan', detail: 'Database healthy after recovery', source: 'server',
      });
      try {
        fs.unlinkSync(marker);
      } catch (e) {
        // best-effort
      }
      await RecoveryStatus.setMaintenance(false, '');
    } else {
      await RecoveryEvents.record(RecoveryEvents.types.MANUAL_REQUIRED, {
        db: 'wekan',
        severity: 'error',
        detail: 'Database still not serving reads after recovery; manual recovery required',
        source: 'server',
      });
      // Leave the maintenance spinner on.
    }
  });

  Meteor.methods({
    // Admin-only manual recovery-event recorder (e.g. for a UI action or an operator
    // tool). Validates input and is gated to admins.
    async recordRecoveryEvent(type, detail) {
      check(type, String);
      check(detail, Match.OneOf(String, null, undefined));

      const user = await Meteor.userAsync();
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized');
      }

      return RecoveryEvents.record(type, { detail: detail || undefined, source: 'manual' });
    },

    // Admin-only: turn the recovery maintenance spinner on/off (e.g. before/after a
    // manual recovery, or a server-initiated re-migration).
    async setRecoveryMaintenance(active, message) {
      check(active, Boolean);
      check(message, Match.OneOf(String, null, undefined));

      const user = await Meteor.userAsync();
      if (!user || !user.isAdmin) {
        throw new Meteor.Error('not-authorized');
      }

      return RecoveryStatus.setMaintenance(active, message || '');
    },
  });
}
