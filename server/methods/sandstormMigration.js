import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel / Attachments / Sandstorm.
//
// Only meaningful when WeKan runs inside a Sandstorm grain (isSandstorm). After
// the one-time MongoDB 3 → FerretDB v1 (SQLite) migration that the grain's
// start.js performs on first launch (see
// docs/Platforms/FOSS/Sandstorm/Meteor3/Migration.md), the raw MongoDB 3.0 database
// files are still on disk under the grain, taking space that FerretDB no longer
// needs. This exposes:
//   - sandstormMigrationStatus(): whether migration completed, its recorded
//     result, and the disk space the raw MongoDB files / FerretDB / files use.
//   - sandstormDeleteRawMongo(): delete the now-redundant raw MongoDB files to
//     free grain disk — guarded so it only runs after a confirmed-successful
//     migration.
//
// The migration writes its result to <files>/db/migration-status.json and an
// idempotency marker; both are read here. Paths are grain paths, overridable by
// env so this stays testable outside a grain.
// ─────────────────────────────────────────────────────────────────────────────

const isSandstorm =
  Meteor.settings &&
  Meteor.settings.public &&
  Meteor.settings.public.sandstorm;

// Raw MongoDB 3.0 WiredTiger data dir the old grain start.js used (read-only
// migration source). Reclaimable after migration.
const RAW_MONGO_PATH =
  process.env.SANDSTORM_RAW_MONGO_PATH || '/var/wiredTigerDb';
// Files root (attachments/, avatars/, db/). WRITABLE_PATH points here in the grain.
const FILES_DIR = process.env.WRITABLE_PATH || '/var/files';
const SQLITE_DIR = path.join(FILES_DIR, 'db');
const STATUS_FILE = path.join(SQLITE_DIR, 'migration-status.json');
const MARKER =
  process.env.SANDSTORM_MIGRATION_MARKER || '/var/.migration-to-ferretdb-done';

// Recursive size of a directory in bytes; tolerant of a missing dir or files
// that vanish mid-walk (returns what it could sum).
function dirBytes(dir) {
  let total = 0;
  const walk = d => {
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      try {
        if (e.isDirectory()) walk(p);
        else if (e.isFile()) total += fs.statSync(p).size;
      } catch (_) {
        /* file vanished / unreadable — skip */
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return total;
}

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (_) {
    return null;
  }
}

async function requireAdmin() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
  return user;
}

Meteor.methods({
  async sandstormMigrationStatus() {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) return false;
    if (!isSandstorm) return { isSandstorm: false };
    const status = readStatus();
    return {
      isSandstorm: true,
      migrationDone: fs.existsSync(MARKER),
      // true only when the recorded migration finished successfully.
      migrationSuccess: !!(status && status.success === true),
      status,
      rawMongoExists: fs.existsSync(RAW_MONGO_PATH),
      rawMongoBytes: dirBytes(RAW_MONGO_PATH),
      ferretBytes: dirBytes(SQLITE_DIR),
      attachmentsBytes: dirBytes(path.join(FILES_DIR, 'attachments')),
      avatarsBytes: dirBytes(path.join(FILES_DIR, 'avatars')),
    };
  },

  async sandstormDeleteRawMongo() {
    await requireAdmin();
    if (!isSandstorm) throw new Meteor.Error('not-sandstorm');
    // Never delete the source before a confirmed-successful migration: the data
    // must already live in FerretDB + on the filesystem.
    if (!fs.existsSync(MARKER)) throw new Meteor.Error('migration-not-done');
    const status = readStatus();
    if (!status || status.success !== true) {
      throw new Meteor.Error('migration-not-successful');
    }
    if (!fs.existsSync(RAW_MONGO_PATH)) {
      return { deleted: false, freedBytes: 0 };
    }
    const freedBytes = dirBytes(RAW_MONGO_PATH);
    fs.rmSync(RAW_MONGO_PATH, { recursive: true, force: true });
    return { deleted: true, freedBytes };
  },
});
