'use strict';

// Attachment retention: remove card attachments after a configurable time,
// for storage and data-minimisation (GDPR) policies. Off unless configured.
// Pure decisions only, so tests/attachmentRetention.test.cjs runs every rule as
// arithmetic; the nightly job is server/attachmentRetention.js.
//
// Two steps, both off by default, that follow WeKan's attachment design
// (docs/Features/General/History/History.md §12):
//
//   ATTACHMENTS_RETENTION_DAYS            expired attachments are SOFT-deleted,
//                                         exactly like "Delete" on a card: the
//                                         card history shows the removal and can
//                                         restore it.
//   ATTACHMENTS_PURGE_DELETED_AFTER_DAYS  attachments soft-deleted at least this
//                                         long ago - by retention or by a person -
//                                         are removed for good, file included.
//                                         Only this step frees storage.
//
// "Expired" depends on ATTACHMENTS_RETENTION_MODE:
//   uploaded       (default) uploaded at least N days ago.
//   card-inactive  uploaded at least N days ago AND its card has had no activity
//                  for N days (dateLastActivity, the date auto-archive and card
//                  aging read). An attachment on a card people still work on is
//                  kept, however old it is.
//
// Never touched: board-level attachments (backgrounds, no card), attachments on
// template boards and template cards, and any attachment whose upload date is
// unknown - a missing date is not a reason to delete.

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 36500;
const MODE_UPLOADED = 'uploaded';
const MODE_CARD_INACTIVE = 'card-inactive';
const MODES = [MODE_UPLOADED, MODE_CARD_INACTIVE];
const DEFAULT_MAX_PER_RUN = 1000;
const MAX_MAX_PER_RUN = 100000;

function unquote(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/^(['"])(.*)\1$/, '$2').trim();
}

// A whole number of days from 1 to MAX_DAYS, else 0 (off).
function normalizeRetentionDays(value) {
  const text = unquote(value);
  if (!/^\d+$/.test(text)) return 0;
  const days = Number(text);
  return days >= 1 && days <= MAX_DAYS ? days : 0;
}

// Unknown or empty is the default mode, never the stricter one by accident.
function normalizeRetentionMode(value) {
  const text = unquote(value).toLowerCase();
  return MODES.includes(text) ? text : MODE_UPLOADED;
}

function normalizeBoolean(value) {
  return ['true', '1', 'yes', 'on'].includes(unquote(value).toLowerCase());
}

function normalizeMaxPerRun(value) {
  const text = unquote(value);
  if (!/^\d+$/.test(text)) return DEFAULT_MAX_PER_RUN;
  const n = Number(text);
  if (n < 1) return DEFAULT_MAX_PER_RUN;
  return Math.min(n, MAX_MAX_PER_RUN);
}

// All settings from one lookup function (process.env by default).
function retentionSettings(env = name => process.env[name]) {
  return {
    retentionDays: normalizeRetentionDays(env('ATTACHMENTS_RETENTION_DAYS')),
    mode: normalizeRetentionMode(env('ATTACHMENTS_RETENTION_MODE')),
    purgeDeletedAfterDays: normalizeRetentionDays(env('ATTACHMENTS_PURGE_DELETED_AFTER_DAYS')),
    dryRun: normalizeBoolean(env('ATTACHMENTS_RETENTION_DRY_RUN')),
    maxPerRun: normalizeMaxPerRun(env('ATTACHMENTS_RETENTION_MAX_PER_RUN')),
  };
}

function toTime(value) {
  if (!value) return NaN;
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

function cutoff(days, now = new Date()) {
  return new Date(toTime(now) - days * DAY_MS);
}

// When the file was uploaded: the server-side stamp (uploadedAtOstrio), or the
// date carried over from a CollectionFS migration (uploadedAt).
function uploadTime(attachment) {
  const t = toTime(attachment && (attachment.uploadedAtOstrio || attachment.uploadedAt));
  return Number.isNaN(t) ? NaN : t;
}

// Candidate selector for the soft-delete step; isExpired() still decides.
// Live card attachments uploaded before the cutoff.
function expiredCandidateSelector(days, now = new Date()) {
  const before = cutoff(days, now);
  return {
    deletedAt: null,
    'meta.cardId': { $exists: true, $nin: [null, ''] },
    $or: [
      { uploadedAtOstrio: { $lte: before } },
      { uploadedAtOstrio: { $exists: false }, uploadedAt: { $lte: before } },
    ],
  };
}

/**
 * Should this live attachment be soft-deleted now?
 * `card` and `board` are the documents it belongs to (null when gone).
 */
function isExpired({ attachment, card, board, days, mode = MODE_UPLOADED, now = new Date() }) {
  if (!attachment || !days) return false;
  if (attachment.deletedAt) return false;
  const meta = attachment.meta || {};
  if (!meta.cardId) return false;
  if (board && (board.type === 'template-board' || board.type === 'template-container')) return false;
  if (card && card.type === 'template-card') return false;
  const limit = toTime(cutoff(days, now));
  const uploaded = uploadTime(attachment);
  if (Number.isNaN(uploaded) || uploaded > limit) return false;
  if (normalizeRetentionMode(mode) === MODE_CARD_INACTIVE) {
    // No card (an orphan) counts as inactive; a card without a usable
    // dateLastActivity is kept - an unknown date is not a reason to delete.
    if (!card) return true;
    const active = toTime(card.dateLastActivity);
    if (Number.isNaN(active)) return false;
    return active <= limit;
  }
  return true;
}

// Selector for the purge step: soft-deleted at least `days` days ago.
function purgeCandidateSelector(days, now = new Date()) {
  return { deletedAt: { $lte: cutoff(days, now) } };
}

function isPurgeable({ attachment, days, now = new Date() }) {
  if (!attachment || !days) return false;
  const deleted = toTime(attachment.deletedAt);
  if (Number.isNaN(deleted)) return false;
  return deleted <= toTime(cutoff(days, now));
}

// Who the soft delete is recorded as: the card history needs a user to show the
// row and offer Restore. The board's creator, the same attribution auto-archive
// and the scheduled rules use for what a board does on a timer; else the
// uploader.
function retentionActorId({ attachment, board }) {
  return (board && board.createdBy) || (attachment && attachment.userId) || null;
}

module.exports = {
  DAY_MS,
  MAX_DAYS,
  MODE_UPLOADED,
  MODE_CARD_INACTIVE,
  DEFAULT_MAX_PER_RUN,
  normalizeRetentionDays,
  normalizeRetentionMode,
  normalizeBoolean,
  normalizeMaxPerRun,
  retentionSettings,
  uploadTime,
  expiredCandidateSelector,
  isExpired,
  purgeCandidateSelector,
  isPurgeable,
  retentionActorId,
};
