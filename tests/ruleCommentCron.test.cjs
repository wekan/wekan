'use strict';

// Guard: the Rule parts GitHub Actions needed and WeKan lacked - "when a card
// is commented on", "add comment", cron schedules and a rule description -
// and that a disabled rule never fires, on a schedule or a button either.
// Run: node tests/ruleCommentCron.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('the comment trigger is matched like the other card triggers', () => {
  assert.match(read('server/triggersDef.js'), /addComment: \{\s*matchingFields: \['boardId', 'userId', 'cardTitle'\],/);
  assert.match(read('server/models/cardComments.js'), /activityType: 'addComment'/);
  assert.match(read('client/components/rules/triggers/boardTriggers.jade'), /option\(value="commented"\)/);
});

test('add comment: written as the person whose change ran it, only where they may comment', () => {
  const helper = read('server/rulesHelper.js');
  const at = helper.indexOf("if (action.actionType === 'addComment')");
  assert.ok(at > 0);
  const block = helper.slice(at, at + 800);
  assert.match(block, /resolveActingUserId\(activity\) \|\| activity\.userId/);
  assert.match(block, /memberCan\(board, authorId, 'comment'\)/);
  assert.match(block, /substituteVars\(action\.commentText/);
  assert.match(read('client/components/rules/actions/cardActions.js'), /actionType: 'addComment',\s*commentText,/);
});

test('cron triggers run in the scheduler, invalid ones never', () => {
  const s = read('server/scheduledRules.js');
  assert.match(s, /if \(trigger\.scheduleKind === 'cron'\) \{\s*if \(!trigger\.cron \|\| !isValidCron\(trigger\.cron\) \|\| !cronMatches\(trigger\.cron, now\)\) continue;/);
  assert.match(read('client/components/rules/triggers/scheduledTriggers.js'), /if \(!isValidCron\(cron\)\)/);
});

test('negative: a disabled rule fires on no path', () => {
  assert.match(read('server/scheduledRules.js'), /if \(!rule \|\| rule\.enabled === false\) return;/);
  assert.match(read('server/rulesButton.js'), /if \(rule\.enabled === false\) throw new Meteor\.Error\('rule-disabled'/);
  assert.match(read('server/rulesHelper.js'), /rule\.enabled !== false && rule\.boardId === activity\.boardId/);
});

test('rules have a description, shown on the rule', () => {
  assert.match(read('models/rules.js'), /description: \{[\s\S]*?type: String,\s*optional: true,/);
  assert.match(read('client/components/rules/ruleDetails.jade'), /if ruleDescription/);
});

console.log(`# ${passed} passed`);
