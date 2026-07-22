'use strict';

// Regression guard for #2674 ("Rule: remove USER from card when move" — a member
// added by a move-to rule was never removed by a move-from rule, and the
// "remove every member" action removed nobody).
// Run: node tests/ruleRemoveMemberAction.test.cjs
//
// The rule member actions operate on the card's ASSIGNEES: `addMember` calls
// card.assignMember() and `removeMember` calls card.unassignMember() (both write
// card.assignees). The "remove all" branch (username === '*') must therefore
// iterate the card's assignees too. It previously iterated card.MEMBERS, a
// different collection, so it never removed anyone a rule had assigned — the
// action silently did nothing (@mweiss237's "remove every member" report).
//
// This is a source guard because performAction() is Meteor-coupled (ReactiveCache,
// Card model methods) and cannot run under plain Node; the invariant we protect is
// that add and remove act on the SAME collection.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'rulesHelper.js'),
  'utf8',
);

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Isolate the removeMember action block so assertions are specific to it.
const removeBlock = (() => {
  const start = src.indexOf("action.actionType === 'removeMember'");
  assert.ok(start > -1, 'removeMember action must exist');
  return src.slice(start, start + 1100);
})();
const addBlock = (() => {
  const start = src.indexOf("action.actionType === 'addMember'");
  assert.ok(start > -1, 'addMember action must exist');
  return src.slice(start, start + 400);
})();

check('addMember assigns (writes card.assignees via assignMember)', () => {
  assert.ok(/card\.assignMember\(/.test(addBlock),
    'addMember must call card.assignMember()');
});

check('removeMember (single user) unassigns the same collection', () => {
  assert.ok(/card\.unassignMember\(member\._id\)/.test(removeBlock),
    'removeMember must call card.unassignMember(member._id)');
});

check('#2674: "remove all" (username === "*") iterates ASSIGNEES, not members', () => {
  // The bug: iterating card.members while unassigning from card.assignees.
  assert.ok(/getAssignees\(\)|card\.assignees/.test(removeBlock),
    'the "*" branch must read the card assignees');
  assert.ok(!/const members = card\.members/.test(removeBlock),
    'the "*" branch must NOT iterate card.members (wrong collection)');
});

check('#2674: "remove all" still unassigns each entry (removal actually happens)', () => {
  const star = removeBlock.slice(removeBlock.indexOf("=== '*'"));
  assert.ok(/for \([^)]*\)[\s\S]*card\.unassignMember\(/.test(star),
    'the "*" branch must loop and call card.unassignMember() for each assignee');
});

check('symmetry: add and remove act on the SAME concept (assign/unassign)', () => {
  // add -> assignMember, remove -> unassignMember: a user added by a move-to
  // rule is removed by a move-from rule (the core #2674 report).
  assert.ok(/assignMember\(/.test(addBlock) && /unassignMember\(/.test(removeBlock),
    'add uses assignMember, remove uses unassignMember');
});

check('negative: an unresolved username is skipped, not crashed on (#2674 defensive)', () => {
  assert.ok(/user "\$\{action\.username\}" not found; skipping/.test(removeBlock) ||
            /not found; skipping/.test(removeBlock),
    'a missing user must warn+skip rather than throw on undefined._id');
});

console.log(`\nruleRemoveMemberAction: ${passed} checks passed`);
