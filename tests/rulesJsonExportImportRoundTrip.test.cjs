'use strict';

// Plain-Node regression guard (no Meteor) for #4294: exporting a board's
// rules as JSON and importing them back (on the same or a different board)
// must never reuse the exported `_id`s or collide with what already exists
// on the target board.
// Run: node tests/rulesJsonExportImportRoundTrip.test.cjs
//
// client/components/rules/rulesImportExport.js needs Meteor/minimongo
// globals (Session, ReactiveCache, Meteor.call) to run for real, so this
// test does two things: (1) reads the source and pins the shape decisions
// the round trip depends on, and (2) exercises a functional re-creation of
// the same export -> strip -> re-insert logic against a tiny in-memory
// "collection" to prove the round trip itself is correct.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const importExportSrc = fs.readFileSync(
  path.join(repoRoot, 'client/components/rules/rulesImportExport.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- 1. Source pins -------------------------------------------------------

test('export strips _id, boardId and timestamps before serializing', () => {
  assert.match(
    importExportSrc,
    /STRIP_FIELDS = \[[^\]]*'_id'[^\]]*'boardId'[^\]]*\]/,
  );
});

test('the exported JSON carries a format tag and a rules array', () => {
  assert.match(importExportSrc, /RULES_FORMAT = 'wekan-rules-1\.0\.0'/);
  assert.match(
    importExportSrc,
    /const data = \{ _format: RULES_FORMAT, boardId, rules: collectBoardRules\(boardId\) \}/,
  );
});

test('import creates rules through the server method, never a raw client insert with the old _id', () => {
  assert.match(importExportSrc, /Meteor\.call\(\s*\n?\s*'rules\.createRule'/);
  // The imported entry's own trigger/action docs (which may still carry the
  // exporting board's old _id) are stripped again before being sent.
  assert.match(
    importExportSrc,
    /normalizeTrigger\(stripDoc\(entry\.trigger\)\)/,
  );
  assert.match(importExportSrc, /stripDoc\(entry\.action\)/);
});

test('import targets the given boardId, not any boardId embedded in the import file', () => {
  assert.match(importExportSrc, /function importRules\(rulesArray, boardId\)/);
  assert.match(
    importExportSrc,
    /Meteor\.call\(\s*\n?\s*'rules\.createRule',\s*\n?\s*boardId,/,
  );
});

// --- 2. Functional round trip ---------------------------------------------
//
// Re-creates the same three steps rulesImportExport.js performs, against a
// tiny fake Mongo-like store, so the actual round trip (not just its shape)
// is verified: export -> strip -> re-insert with fresh ids on a new board.

const STRIP_FIELDS = ['_id', 'boardId', 'createdAt', 'modifiedAt', 'updatedAt'];

function stripDoc(doc) {
  const out = {};
  Object.keys(doc || {}).forEach(key => {
    if (!STRIP_FIELDS.includes(key)) out[key] = doc[key];
  });
  return out;
}

function makeFakeDb() {
  let nextId = 1;
  const rules = [];
  const triggers = [];
  const actions = [];
  return {
    insertTrigger(doc) {
      const _id = `trigger-${nextId++}`;
      triggers.push({ _id, ...doc });
      return _id;
    },
    insertAction(doc) {
      const _id = `action-${nextId++}`;
      actions.push({ _id, ...doc });
      return _id;
    },
    insertRule(doc) {
      const _id = `rule-${nextId++}`;
      rules.push({ _id, ...doc });
      return _id;
    },
    allIds() {
      return [
        ...rules.map(r => r._id),
        ...triggers.map(t => t._id),
        ...actions.map(a => a._id),
      ];
    },
    rules,
    triggers,
    actions,
  };
}

// Mirrors collectBoardRules(): board's rules -> portable {title, trigger, action}.
function exportRules(db, boardId) {
  return db.rules
    .filter(r => r.boardId === boardId)
    .map(rule => {
      const trigger = db.triggers.find(t => t._id === rule.triggerId);
      const action = db.actions.find(a => a._id === rule.actionId);
      return { title: rule.title, trigger: stripDoc(trigger), action: stripDoc(action) };
    });
}

// Mirrors importRules(): re-creates trigger+action+rule with FRESH ids on
// the target board, exactly like server/rulesButton.js `rules.createRule`.
function importRulesIntoDb(db, exported, targetBoardId) {
  return exported.map(entry => {
    const triggerId = db.insertTrigger({ ...stripDoc(entry.trigger), boardId: targetBoardId });
    const actionId = db.insertAction({ ...stripDoc(entry.action), boardId: targetBoardId });
    return db.insertRule({
      title: entry.title,
      triggerId,
      actionId,
      boardId: targetBoardId,
    });
  });
}

test('round trip: export then import on a DIFFERENT board yields equivalent, freshly-id\'d docs', () => {
  const source = makeFakeDb();
  const srcTriggerId = source.insertTrigger({
    boardId: 'board-A',
    activityType: 'createCard',
    listName: 'Doing',
  });
  const srcActionId = source.insertAction({
    boardId: 'board-A',
    actionType: 'setDueDate',
  });
  const srcRuleId = source.insertRule({
    title: 'When card added to Doing, then set due date',
    triggerId: srcTriggerId,
    actionId: srcActionId,
    boardId: 'board-A',
  });

  const exported = exportRules(source, 'board-A');
  assert.strictEqual(exported.length, 1);
  // The exported shape carries no _id/boardId of its own.
  assert.strictEqual(exported[0].trigger._id, undefined);
  assert.strictEqual(exported[0].trigger.boardId, undefined);
  assert.strictEqual(exported[0].action._id, undefined);

  // Import onto a different board, into a SEPARATE db that already has ids
  // 1..N used (same counter shared here to prove no collision even when the
  // id-generation sequence overlaps what the source board used).
  const [newRuleId] = importRulesIntoDb(source, exported, 'board-B');

  const newRule = source.rules.find(r => r._id === newRuleId);
  const newTrigger = source.triggers.find(t => t._id === newRule.triggerId);
  const newAction = source.actions.find(a => a._id === newRule.actionId);

  // New _ids, never reusing the originals.
  assert.notStrictEqual(newRuleId, srcRuleId);
  assert.notStrictEqual(newRule.triggerId, srcTriggerId);
  assert.notStrictEqual(newRule.actionId, srcActionId);

  // boardId follows the IMPORT target, not the source.
  assert.strictEqual(newRule.boardId, 'board-B');
  assert.strictEqual(newTrigger.boardId, 'board-B');
  assert.strictEqual(newAction.boardId, 'board-B');

  // Trigger/action content (the actual automation) is preserved.
  assert.strictEqual(newTrigger.activityType, 'createCard');
  assert.strictEqual(newTrigger.listName, 'Doing');
  assert.strictEqual(newAction.actionType, 'setDueDate');
  assert.strictEqual(newRule.title, 'When card added to Doing, then set due date');

  // No id collisions anywhere in the store.
  const ids = source.allIds();
  assert.strictEqual(new Set(ids).size, ids.length);
});

test('importing the same export twice creates two independent rules, not one reused', () => {
  const db = makeFakeDb();
  const triggerId = db.insertTrigger({ boardId: 'board-A', activityType: 'archive' });
  const actionId = db.insertAction({ boardId: 'board-A', actionType: 'archive' });
  db.insertRule({ title: 'Archive rule', triggerId, actionId, boardId: 'board-A' });

  const exported = exportRules(db, 'board-A');
  const [firstImportedId] = importRulesIntoDb(db, exported, 'board-B');
  const [secondImportedId] = importRulesIntoDb(db, exported, 'board-B');

  assert.notStrictEqual(firstImportedId, secondImportedId);
  assert.strictEqual(db.rules.filter(r => r.boardId === 'board-B').length, 2);
});

console.log(`rulesJsonExportImportRoundTrip: ${passed} passed`);
