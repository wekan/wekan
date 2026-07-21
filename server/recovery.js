import fs from 'fs';
import path from 'path';
import RecoveryEvents from '/models/recoveryEvents';
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

if (Meteor.isServer) {
  Meteor.startup(() => {
    importRecoveryEventsFromFile().catch(() => {});
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
  });
}
