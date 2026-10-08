'use strict';

// Regression guard for #2674 ("Rule: remove USER from card when move" - a member
// added by a move-to rule was never removed by a move-from rule, and the
// "remove every member" action removed nobody) and for the assignee actions
// #4294 asked for ("I want the assignee to be the creator of the card").
// Run: node tests/ruleRemoveMemberAction.test.cjs
//
// The rule member actions operate on card.MEMBERS: addMember calls
// card.assignMember() and removeMember card.unassignMember(), and both write
// `members` (models/cards.js, read below so this guard follows the model). An
// earlier version of this file said they wrote `assignees` and pinned the
// "remove all" branch to the assignees, so "remove all" removed only members
// who were also assignees. The assignee actions operate on card.ASSIGNEES
// through assignAssignee / unassignAssignee.
//
// This is a source guard because performAction() is Meteor-coupled (ReactiveCache,
// Card model methods) and cannot run under plain Node; the invariant it protects
// is that add, remove and remove-all act on the SAME collection, per action.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const src = read('server/rulesHelper.js');
const cards = read('models/cards.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// One action's block, up to the next action.
const block = (type, next) => {
  const start = src.indexOf(`if (action.actionType === '${type}')`);
  assert.ok(start > -1, `${type} action must exist`);
  const end = src.indexOf(`if (action.actionType === '${next}')`, start);
  assert.ok(end > start, `${next} must follow ${type}`);
  return src.slice(start, end);
};
const addMember = block('addMember', 'removeMember');
const removeMember = block('removeMember', 'addAssignee');
const addAssignee = block('addAssignee', 'removeAssignee');
const removeAssignee = src.slice(src.indexOf("if (action.actionType === 'removeAssignee')"),
  src.indexOf('// #5283: the checklist'));
const code = text => text.replace(/\/\/[^\n]*/g, '');

check('the model: assignMember/unassignMember write members, assignAssignee/unassignAssignee write assignees', () => {
  assert.match(cards, /assignMember\(memberId\) \{\s*return Cards\.updateAsync\(this\.getRealId\(\), \{ \$addToSet: \{ members: memberId \} \}\);/);
  assert.match(cards, /assignAssignee\(assigneeId\) \{\s*return Cards\.updateAsync\(this\.getRealId\(\), \{ \$addToSet: \{ assignees: assigneeId \} \}\);/);
  assert.match(cards, /return Cards\.updateAsync\(\{ _id: this\._id \}, \{ \$pull: \{ members: memberId \} \}\);/);
});

check('members: add assigns, remove unassigns, remove-all iterates card.members', () => {
  assert.ok(/card\.assignMember\(/.test(addMember));
  assert.ok(/card\.unassignMember\(member\._id\)/.test(removeMember));
  const star = code(removeMember.slice(removeMember.indexOf("=== '*'")));
  assert.ok(/const members = \[\.\.\.\(card\.members \|\| \[\]\)\];/.test(star), 'snapshot of card.members');
  assert.ok(/for \([^)]*\)[\s\S]*card\.unassignMember\(members\[i\]\)/.test(star));
  assert.ok(!/assignees/.test(star), 'remove-all members never reads the assignees');
});

check('assignees (#4294): add, remove and remove-all act on card.assignees', () => {
  assert.ok(/card\.assignAssignee\(/.test(addAssignee));
  assert.ok(/RULE_ACTING_USER_SENTINEL/.test(addAssignee), 'the acting user can be made the assignee');
  assert.ok(/ruleUsernames\(action\.username, ruleVars\)/.test(addAssignee), '{creator} and the other tokens resolve');
  assert.ok(/card\.unassignAssignee\(assignee\._id\)/.test(removeAssignee));
  const star = code(removeAssignee.slice(removeAssignee.indexOf("=== '*'")));
  assert.ok(/const assignees = \[\.\.\.\(card\.assignees \|\| \[\]\)\];/.test(star));
  assert.ok(/card\.unassignAssignee\(assignees\[i\]\)/.test(star));
  assert.ok(!/members|assignMember/.test(star));
});

check('durable Sync resolves the same people for each action', () => {
  const resolve = code(src.slice(src.indexOf('async resolveMemberTargets'), src.indexOf('async executeRules')));
  assert.match(resolve, /type === 'removeMember'\) \{\s*if \(action\.username === '\*'\) ids\.push\(\.\.\.\(card\.members \|\| \[\]\)\);/);
  assert.match(resolve, /type === 'removeAssignee'\) \{\s*if \(action\.username === '\*'\) ids\.push\(\.\.\.\(card\.assignees \|\| \[\]\)\);/);
  const command = read('server/lib/syncRuleCardCommand.js');
  assert.match(command, /addAssignee: 'assignees', removeAssignee: 'assignees'/);
  assert.match(command, /addAssignee: \{ field: 'assignees', join: true, activity: 'joinAssignee', idKey: 'assigneeId' \}/);
});

check('negative: an unresolved username is skipped, not crashed on', () => {
  for (const [name, text] of [['removeMember', removeMember], ['addAssignee', addAssignee], ['removeAssignee', removeAssignee]]) {
    assert.ok(/not found; skipping/.test(text), name);
  }
});

console.log(`\nruleRemoveMemberAction: ${passed} checks passed`);
