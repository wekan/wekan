import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const { SimpleSchema } = require('/imports/simpleSchema');

// #6492 Recovery / Remediation audit log.
//
// An append-only record of the automatic data-safety actions taken for the SQLite
// text-data database — corruption detected, a backup created/verified, a restore from
// a backup copy, a re-migration of text data from MongoDB, an automatic VACUUM of a
// bloated file, etc. Shown to admins in Admin Panel / Problems / Recovery so the
// remediation history is visible in the logical, generally-used place.
const RecoveryEvents = new Mongo.Collection('recoveryEvents');

// Known event types (kept as plain strings so external tools can record their own).
RecoveryEvents.types = {
  CORRUPTION_DETECTED: 'corruption-detected',
  BACKUP_CREATED: 'backup-created',
  BACKUP_FAILED: 'backup-failed',
  BACKUP_VERIFIED: 'backup-verified',
  RESTORE_BACKUP: 'restore-backup',
  RESTORE_PREV: 'restore-prev',
  RESTORE_FAILED: 'restore-failed',
  REMIGRATE: 'remigrate',
  BLOAT_REPAIRED: 'bloat-repaired',
  INTEGRITY_OK: 'integrity-ok',
  MANUAL_REQUIRED: 'manual-required',
  PERMANENT_DELETE_SETTING_CHANGED: 'permanent-delete-setting-changed',
  BOARD_PERMANENTLY_DELETED: 'board-permanently-deleted',
};

RecoveryEvents.attachSchema(
  new SimpleSchema({
    type: {
      // one of RecoveryEvents.types (or any string an external tool records)
      type: String,
    },
    db: {
      // the affected database, e.g. 'wekan'
      type: String,
      optional: true,
    },
    detail: {
      // human-readable description of what happened / what was decided
      type: String,
      optional: true,
    },
    severity: {
      // 'info' | 'warning' | 'error' — drives how the row is shown
      type: String,
      allowedValues: ['info', 'warning', 'error'],
      optional: true,
    },
    source: {
      // where the event came from: 'server' | 'startup' | 'ferretdb' | 'manual'
      type: String,
      optional: true,
    },
    done: {
      // Database Boolean shown as the first Recovery report column.
      type: Boolean,
      optional: true,
    },
    deletedData: {
      // Successful destructive operations add a yellow trash icon beside Done.
      type: Boolean,
      optional: true,
    },
    userId: { type: String, optional: true },
    username: { type: String, optional: true },
    ipv4: { type: String, optional: true },
    ipv6: { type: String, optional: true },
    boardIds: { type: Array, optional: true },
    'boardIds.$': { type: String },
    boardTitles: { type: Array, optional: true },
    'boardTitles.$': { type: String },
    createdAt: {
      type: Date,
      optional: true,
    },
  }),
);

// record appends one recovery event. Server-only and BEST-EFFORT: an audit-log write
// must never throw into (or block) the safety action it is recording.
RecoveryEvents.record = async function record(type, opts = {}) {
  if (!Meteor.isServer || !type) {
    return null;
  }

  try {
    return await RecoveryEvents.insertAsync({
      type,
      db: opts.db,
      detail: opts.detail,
      severity: opts.severity || 'info',
      source: opts.source || 'server',
      done: opts.done !== false,
      deletedData: opts.deletedData === true,
      userId: opts.userId,
      username: opts.username,
      ipv4: opts.ipv4,
      ipv6: opts.ipv6,
      boardIds: opts.boardIds,
      boardTitles: opts.boardTitles,
      createdAt: new Date(),
    });
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.error('RecoveryEvents.record failed:', e && e.message);
    }
    return null;
  }
};

if (Meteor.isServer) {
  // Admin Panel / Problems / Recovery pages these newest-first and counts them
  // with the same selector (server/publications/recoveryReport.js).
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(RecoveryEvents, { createdAt: -1 });
  });
}

export default RecoveryEvents;
