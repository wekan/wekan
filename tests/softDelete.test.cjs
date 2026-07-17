'use strict';

// Tests for the soft-delete core (models/lib/softDelete.js): the query filter, the
// delete/restore modifiers, and the purge gate — including negative cases.
//
// Run: node tests/softDelete.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  notDeleted,
  softDeleteSet,
  restoreModifier,
  isDeleted,
  canPurge,
} = require('../models/lib/softDelete.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- notDeleted() ---
test('notDeleted adds deletedAt:null to a plain selector', () => {
  assert.deepStrictEqual(notDeleted({ boardId: 'b', archived: false }), {
    boardId: 'b',
    archived: false,
    deletedAt: null,
  });
});

test('notDeleted on empty/undefined selector still constrains', () => {
  assert.deepStrictEqual(notDeleted(), { deletedAt: null });
  assert.deepStrictEqual(notDeleted({}), { deletedAt: null });
});

test('notDeleted merges into an existing $and instead of clobbering it', () => {
  const out = notDeleted({ $and: [{ a: 1 }, { b: 2 }] });
  assert.deepStrictEqual(out, { $and: [{ a: 1 }, { b: 2 }, { deletedAt: null }] });
});

test('notDeleted preserves a top-level $or (AND semantics)', () => {
  const out = notDeleted({ $or: [{ x: 1 }, { y: 2 }] });
  assert.deepStrictEqual(out, { $or: [{ x: 1 }, { y: 2 }], deletedAt: null });
});

// deletedAt:null must match BOTH missing and null (the whole no-backfill premise).
test('deletedAt:null is the correct match for absent-or-null (documented contract)', () => {
  // Mongo/Minimongo semantics: {field: null} matches missing OR null. We assert the
  // *shape* the code relies on (value literally null, not {$exists:false}).
  assert.strictEqual(notDeleted({}).deletedAt, null);
});

// --- softDeleteSet() ---
test('softDeleteSet stamps the passed timestamp + actor + batch', () => {
  const at = new Date('2026-07-17T00:00:00Z');
  assert.deepStrictEqual(softDeleteSet('user1', 'batch1', at), {
    deletedAt: at,
    deletedBy: 'user1',
    deleteBatchId: 'batch1',
  });
});

test('softDeleteSet OMITS falsy actor/batch (never $set null on a String field)', () => {
  const at = new Date('2026-07-17T00:00:00Z');
  const out = softDeleteSet(undefined, undefined, at);
  assert.deepStrictEqual(out, { deletedAt: at }); // no deletedBy/deleteBatchId keys
  assert.ok(!('deletedBy' in out) && !('deleteBatchId' in out));
});

// --- restoreModifier() ---
test('restoreModifier drops all three fields via $unset (no null $set)', () => {
  assert.deepStrictEqual(restoreModifier(), {
    $unset: { deletedAt: '', deletedBy: '', deleteBatchId: '' },
  });
});

// --- isDeleted() ---
test('isDeleted true only when deletedAt is set', () => {
  assert.strictEqual(isDeleted({ deletedAt: new Date() }), true);
  assert.strictEqual(isDeleted({ deletedAt: null }), false); // negative
  assert.strictEqual(isDeleted({}), false); // negative
  assert.strictEqual(isDeleted(null), false); // negative
});

// --- canPurge() : the whole point of "one narrow purge path" ---
test('canPurge requires BOTH admin AND the enable flag', () => {
  assert.strictEqual(canPurge({ isAdmin: true }, true), true);
  // negatives — each condition alone is not enough
  assert.strictEqual(canPurge({ isAdmin: true }, false), false);
  assert.strictEqual(canPurge({ isAdmin: false }, true), false);
  assert.strictEqual(canPurge({ isAdmin: false }, false), false);
  assert.strictEqual(canPurge(null, true), false);
  assert.strictEqual(canPurge(undefined, true), false);
});

// --- source guards: the render-path queries actually filter, and the delete path
//     routes through soft delete rather than a bare removeAsync ---
const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('board + swimlane list render paths filter soft-deleted lists', () => {
  const boards = read('models/boards.js');
  const swim = read('models/swimlanes.js');
  assert.ok(/draggableLists\(\)/.test(boards) && /deletedAt: null/.test(boards),
    'boards.js list queries carry deletedAt:null');
  assert.ok(/deletedAt: null/.test(swim), 'swimlanes.js list queries carry deletedAt:null');
});

test('list delete goes through the soft-remove method, not Lists.remove', () => {
  const header = read('client/components/lists/listHeader.js');
  assert.ok(/Meteor\.call\('lists\.softRemove'/.test(header), 'client calls lists.softRemove');
  // NEGATIVE guard: the old hard-delete calls must be gone from the delete handler.
  const i = header.indexOf("'click .js-delete'");
  const block = header.slice(i, i + 700);
  assert.ok(!/Lists\.remove\(/.test(block), 'no bare Lists.remove in the delete handler');
});

test('soft-remove method records delete history and cascades to cards', () => {
  const s = read('server/models/lists.js');
  assert.ok(/lists\.softRemove/.test(s), 'softRemove method');
  assert.ok(/actionType: 'delete'/.test(s), 'records a delete in history');
  assert.ok(/deleteBatchId/.test(s), 'stamps a batch id for the cascade');
});

test('purge method is gated on isAdmin && enablePermanentDelete', () => {
  const s = read('server/models/lists.js');
  const i = s.indexOf('lists.purge');
  assert.ok(i !== -1, 'purge method exists');
  const block = s.slice(i, i + 800);
  assert.ok(/canPurge/.test(block), 'purge consults canPurge');
});

console.log(`\nAll ${passed} soft-delete tests passed`);
