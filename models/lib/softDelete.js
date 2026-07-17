'use strict';

// Soft-delete core (delete = mark, never destroy). Design: docs/Features/Undo/Undo.md.
//
// Kept Meteor-free and CommonJS so these decisions are unit-testable
// (tests/softDelete.test.cjs) AND importable from server model code (Meteor's
// module system reads the named exports off `module.exports`). Every user-facing
// delete routes through here so the "no permanent delete in ordinary use" rule is
// enforced in one place; physical removal is only ever done by the flag-gated
// admin purge or by GDPR/account erasure.

// Add the "not soft-deleted" constraint to a Mongo/Minimongo selector.
// `{ deletedAt: null }` matches BOTH documents whose field is null and whose field
// is ABSENT (all pre-feature rows), so no migration/backfill is needed. Merges into
// an existing `$and` when present so we never clobber a sibling constraint.
function notDeleted(selector) {
  const sel = selector || {};
  if (sel && typeof sel === 'object' && Array.isArray(sel.$and)) {
    return { ...sel, $and: [...sel.$and, { deletedAt: null }] };
  }
  return { ...sel, deletedAt: null };
}

// The `$set` applied when soft-deleting a document. `at` is passed in (never
// generated here) so the same batch of cascaded deletes shares one timestamp and
// the function stays pure/deterministic. Falsy userId/batchId are OMITTED rather
// than set to null: `deletedBy`/`deleteBatchId` are String schema fields and
// collection2 would reject a null value on update.
function softDeleteSet(userId, batchId, at) {
  const set = { deletedAt: at };
  if (userId) set.deletedBy = userId;
  if (batchId) set.deleteBatchId = batchId;
  return set;
}

// The full modifier applied when RESTORING (undo of a delete): drop all three
// bookkeeping fields, so a restored doc is indistinguishable from one that was
// never deleted. Pure `$unset` (rather than `$set deletedAt: null`) because setting
// an optional Date field to null trips SimpleSchema type validation; an absent
// field reads as "live" via the `{ deletedAt: null }` filter.
function restoreModifier() {
  return {
    $unset: { deletedAt: '', deletedBy: '', deleteBatchId: '' },
  };
}

// Is a document soft-deleted?
function isDeleted(doc) {
  return !!(doc && doc.deletedAt);
}

// May this user PHYSICALLY purge user content? Only a global admin, and only when
// the Admin Panel / Features / Delete toggle ("Enable permanent delete for Global
// Admin") is on. GDPR/account erasure is a SEPARATE path and does not consult this.
function canPurge(user, enablePermanentDelete) {
  return !!(user && user.isAdmin) && !!enablePermanentDelete;
}

module.exports = {
  notDeleted,
  softDeleteSet,
  restoreModifier,
  isDeleted,
  canPurge,
};
