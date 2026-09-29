'use strict';

// #4294 / #3195: trigger values accept the action variables
// (models/lib/ruleTriggerVars.js). Run: node tests/ruleTriggerVars.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { triggerValueHasVars, triggerVarMatches, triggerMatchesWithVars } = require('../models/lib/ruleTriggerVars.js');

const vars = {
  creator: 'carol', assignees: 'alice, bob', members: '', list: 'Doing', card: 'Fix login',
  customfield: { target: 'Done', 'review stage': 'QA' },
};

assert.ok(triggerValueHasVars('{customField:Target}'));
assert.ok(triggerValueHasVars('Stage {list}'));
for (const plain of ['Done', '*', '', null, undefined, 'a { b }', '{}', '{ x }']) assert.ok(!triggerValueHasVars(plain), String(plain));

// A field resolved from the card.
assert.ok(triggerVarMatches('{customField:Target}', 'Done', vars));
assert.ok(triggerVarMatches('{customfield:REVIEW STAGE}', 'QA', vars), 'field names are case-insensitive');
assert.ok(triggerVarMatches('Stage {list}', 'Stage Doing', vars));
assert.ok(!triggerVarMatches('{customField:Target}', 'Doing', vars));
// People tokens match any one listed name, never the joined text.
assert.ok(triggerVarMatches('{assignees}', 'alice', vars));
assert.ok(triggerVarMatches('{assignees}', 'bob', vars));
assert.ok(!triggerVarMatches('{assignees}', 'alice, bob', vars));
assert.ok(!triggerVarMatches('{assignees}', 'carol', vars));
assert.ok(triggerVarMatches('{creator}', 'carol', vars));
assert.ok(!triggerVarMatches('{members}', '', vars), 'nobody listed matches nobody');
// Negative: an unknown or unset token stays literal and matches only itself.
assert.ok(!triggerVarMatches('{customField:Missing}', 'Done', vars));
assert.ok(triggerVarMatches('{customField:Missing}', '{customField:Missing}', vars));
assert.ok(!triggerVarMatches('{nosuch}', '', vars));
assert.ok(!triggerVarMatches('{customField:Target}', undefined, vars));
assert.ok(!triggerVarMatches('Done', 'Done', vars), 'a plain value is the ordinary query, not this');
console.log('  ok - a trigger value with variables is resolved for the card');

// Whole trigger: variable fields resolved, the rest by the ordinary rule.
const plain = actual => (field, expected) => expected === undefined || expected === null || expected === '*' || expected === actual[field];
const fields = ['boardId', 'listName', 'userId', 'swimlaneName', 'cardTitle'];
const actual = { boardId: 'b1', listName: 'Done', userId: 'alice', swimlaneName: 'Default', cardTitle: 'Fix login' };
const trigger = { boardId: 'b1', listName: '{customField:Target}', userId: '*', swimlaneName: '*', cardTitle: '*' };
assert.ok(triggerMatchesWithVars(trigger, fields, actual, vars, plain(actual)));
assert.ok(triggerMatchesWithVars({ ...trigger, userId: '{assignees}' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, userId: '{creator}' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, swimlaneName: 'Other' }, fields, actual, vars, plain(actual)),
  'a plain field still has to match');
assert.ok(!triggerMatchesWithVars({ ...trigger, boardId: 'b2' }, fields, actual, vars, plain(actual)));
assert.ok(!triggerMatchesWithVars({ ...trigger, listName: 'Done' }, fields, actual, vars, plain(actual)),
  'a trigger without variables is left to the ordinary query, so it is not matched twice');
console.log('  ok - every field of a trigger has to match');

// Wiring.
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const helper = read('server/rulesHelper.js');
assert.match(helper, /\$or: tokenFields\.map\(field => \(\{ \[field\]: \{ \$regex: '\\\\\{\\\\w\+\(\?::\[\^\{\}\]\+\)\?\\\\\}' \} \}\)\)/);
assert.match(helper, /boardId: \{ \$in: \[activity\.boardId, '\*', null\] \}/, 'only this board\'s triggers');
assert.match(helper, /const vars = await buildRuleVars\(activity, card\);/, 'the same variables actions use');
assert.match(helper, /tokenValues\.userId = actor \? actor\.username : undefined;/);
assert.match(helper, /return uniqueRules\(matchingRules\.filter\(rule => rule\.enabled !== false\)\);/,
  'a disabled rule still never fires, and one matched twice runs once');
assert.match(read('client/components/rules/rulesMain.js'), /if \(triggerValueHasVars\(username\)\) \{[\s\S]*?trigger\.userId = username\.trim\(\);/);
assert.match(read('client/components/rules/rulesTriggers.jade'), /js-trigger-vars-hint \{\{_ 'r-trigger-vars-hint'\}\}/);
assert.ok(JSON.parse(read('imports/i18n/data/en.i18n.json'))['r-trigger-vars-hint'].includes('{customField:Name}'));
console.log('  ok - rules find token triggers, and the editor keeps and explains them');
