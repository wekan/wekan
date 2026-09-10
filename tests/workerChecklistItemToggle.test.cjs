'use strict';

// wekan/wekan#3307: "a board member with the Worker role cannot check/uncheck
// checklist items" - the reporter's actual ask was narrower than the issue's own
// suggested fixes (a new "Contributor" role): let a Worker CHECK an item without
// being able to DELETE a checklist or an item, which a Normal member can do.
//
// Both the server allow rule (server/permissions/checklistItems.js) and the
// client template (client/components/cards/checklists.jade) gated EVERY write on
// the same `write`/canModifyCard check that also gates editing and deleting -
// the same broad check used for deletion, which is the reported bug. This pins
// the field-level carve-out that fixes it, the same shape as the existing
// move/self-assign carve-out for cards (models/lib/workerCardWrite.js).
//
// Run: node tests/workerChecklistItemToggle.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { workerMayToggleChecklistItem } = require('../models/lib/workerChecklistItemToggle.js');

const ME = 'worker-user-id';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('workerChecklistItemToggle:');

// ── what a Worker may do ────────────────────────────────────────────────────
test('a Worker may check an item', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { isFinished: true } }), true);
});

test('and uncheck it again', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { isFinished: false } }), true);
});

// ── what a Worker may NOT do (negative) ─────────────────────────────────────
test('a Worker may not edit the item title alongside the toggle', () => {
  assert.strictEqual(
    workerMayToggleChecklistItem(ME, { $set: { isFinished: true, title: 'sneaked in' } }),
    false, 'a second field alongside isFinished is a second write');
});

test('a Worker may not edit the item title alone', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { title: 'rewritten' } }), false);
});

test('a Worker may not move the item to another checklist/card', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { checklistId: 'other' } }), false);
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { cardId: 'other-card' } }), false);
});

test('a Worker may not $unset or $rename their way around the toggle', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $unset: { title: '' } }), false);
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $rename: { isFinished: 'done' } }), false);
});

test('isFinished must actually be a boolean', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { isFinished: 'true' } }), false);
  assert.strictEqual(workerMayToggleChecklistItem(ME, { $set: { isFinished: 1 } }), false);
});

test('a whole-document replacement is refused', () => {
  assert.strictEqual(workerMayToggleChecklistItem(ME, { isFinished: true }), false);
  assert.strictEqual(workerMayToggleChecklistItem(ME, {}), false);
});

test('junk never becomes permission', () => {
  for (const junk of [null, undefined, 0, '', 'string', [], [{ $set: { isFinished: true } }]]) {
    assert.strictEqual(workerMayToggleChecklistItem(ME, junk), false, `allowed: ${JSON.stringify(junk)}`);
  }
  assert.strictEqual(workerMayToggleChecklistItem(null, { $set: { isFinished: true } }), false,
    'no user id: nobody to allow');
  assert.strictEqual(workerMayToggleChecklistItem(undefined, { $set: { isFinished: true } }), false);
});

// ── wiring: the server allow rule actually uses this policy ────────────────
test('the server allow rule falls back to the Worker toggle carve-out', () => {
  const src = read('server/permissions/checklistItems.js');
  assert.ok(/workerMayToggleChecklistItem/.test(src),
    'the allow rule must call the same policy this test pins');
  assert.ok(/board\.hasWorker\(userId\)/.test(src),
    'and only grant it to an actual Worker, not any refused-write member');
  assert.ok(/fetch:\s*\[[^\]]*'boardId'/.test(src),
    'boardId must be fetched, or doc.boardId is undefined and the Worker check always fails');
});

// ── wiring: the client draws a clickable box for a Worker, and nothing else ──
test('the client gates the checkbox on the narrower capability', () => {
  const jade = read('client/components/cards/checklists.jade');
  const checklistItemDetail = jade.slice(jade.indexOf("template(name='checklistItemDetail')"));
  assert.ok(/if canCheckChecklistItem/.test(checklistItemDetail),
    'the checkbox must be drawn under the narrower helper, not canModifyCard');
  // The rest of the row (title edit, drag handle, due-date edit, delete) stays
  // behind canModifyCard - #3307 asked for check, not edit/delete.
  assert.ok(/if canModifyCard/.test(checklistItemDetail),
    'editing/dragging/due-date-editing must still require the full write capability');

  const utils = read('client/lib/utils.js');
  assert.ok(/canCheckChecklistItem\(card = Utils\.getCurrentCard\(\)\)/.test(utils),
    'Utils.canCheckChecklistItem must exist');
  assert.ok(/user\.isWorker/.test(utils.slice(utils.indexOf('canCheckChecklistItem'))),
    'and it must widen to a Worker on top of canModifyCard');

  const blazeHelpers = read('client/config/blazeHelpers.js');
  assert.ok(/registerHelper\('canCheckChecklistItem'/.test(blazeHelpers),
    'the jade template needs a registered Blaze helper of the same name');
});

// ── negative: deletion stays on the broad check ─────────────────────────────
test('deleting a checklist item is still gated by canModifyCard, not the toggle', () => {
  const jade = read('client/components/cards/checklists.jade');
  const editForm = jade.slice(
    jade.indexOf('template(name="editChecklistItemForm")'),
    jade.indexOf('template(name="editChecklistItemForm")') + 800,
  );
  assert.ok(/if canModifyCard/.test(editForm),
    'the delete link (js-delete-checklist-item) must stay inside a canModifyCard block');
  assert.ok(/js-delete-checklist-item/.test(editForm));

  const permissions = read('server/permissions/checklistItems.js');
  const removeRule = permissions.slice(
    permissions.indexOf('async remove('),
    permissions.indexOf('},', permissions.indexOf('async remove(')),
  );
  assert.ok(/canEditCardOrLinkedCard/.test(removeRule),
    'remove must stay on the full write check - a Worker deleting an item would be the regression');
  assert.ok(!/workerMayToggleChecklistItem/.test(removeRule),
    'the toggle carve-out must never apply to remove');
});

console.log(`workerChecklistItemToggle: ${passed} passed`);
