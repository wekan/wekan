'use strict';

// Rules with several triggers and actions (models/lib/ruleParts.js).
// Run: node tests/ruleParts.test.cjs
//
// Maintainer decision 2026-09-29 (#4294, #2953): a rule fires when ANY of its
// triggers fires, once per activity, and runs its actions in order.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ruleTriggerIds, ruleActionIds, uniqueRules, ruleForTriggerSelector, remapRuleParts, MAX_EXTRA_RULE_PARTS } =
  require('../models/lib/ruleParts.js');

// Order, deduplication and legacy rules.
const rule = { _id: 'r', triggerId: 't1', actionId: 'a1', extraTriggerIds: ['t2', 't1', 't3'], extraActionIds: ['a2', 'a3'] };
assert.deepEqual(ruleTriggerIds(rule), ['t1', 't2', 't3']);
assert.deepEqual(ruleActionIds(rule), ['a1', 'a2', 'a3'], 'the original action runs first');
assert.deepEqual(ruleActionIds({ actionId: 'a' }), ['a'], 'a rule without extras is unchanged');
assert.deepEqual(ruleTriggerIds(null), []);
assert.deepEqual(ruleActionIds({ actionId: 'a', extraActionIds: [null, '', 5, 'b'] }), ['a', 'b']);
assert.equal(MAX_EXTRA_RULE_PARTS, 10);

// A rule matched through two of its triggers runs once; different rules all run.
assert.deepEqual(uniqueRules([{ _id: 'r' }, { _id: 's' }, { _id: 'r' }, null]).map(r => r._id), ['r', 's']);
assert.deepEqual(ruleForTriggerSelector('t2'), { $or: [{ triggerId: 't2' }, { extraTriggerIds: 't2' }] });

// Copy/import: every part is remapped; an uncopied extra is dropped, never kept
// pointing at the source board.
const copied = remapRuleParts({ ...rule }, { t1: 'T1', t2: 'T2' }, { a1: 'A1', a2: 'A2', a3: 'A3' });
assert.deepEqual([copied.triggerId, copied.extraTriggerIds, copied.actionId, copied.extraActionIds],
  ['T1', ['T2'], 'A1', ['A2', 'A3']]);
assert.equal(remapRuleParts({ triggerId: 't', actionId: 'a' }, { t: 'T' }, { a: 'A' }).extraTriggerIds, undefined);

// Every place that runs, stores, copies or shows a rule handles all its parts.
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const checks = {
  'models/rules.js': [/extraTriggerIds: \{/, /extraActionIds: \{/, /maxCount: 10/],
  'models/triggers.js': [/ReactiveCache\.getRule\(ruleForTriggerSelector\(this\._id\)\)/],
  'server/rulesHelper.js': [/return uniqueRules\(matchingRules\.filter/, /for \(const extraId of ruleActionIds\(rule\)\.slice\(1\)\)/],
  'server/scheduledRules.js': [/getRule\(ruleForTriggerSelector\(trigger\._id\)\)/, /for \(const actionId of ruleActionIds\(rule\)\)/],
  'server/rulesButton.js': [/for \(const actionId of ruleActionIds\(rule\)\)/, /'rules\.addPart'\(ruleId, kind, doc\)/,
    /'rules\.removePart'\(ruleId, kind, partId\)/, /A button cannot be an extra trigger/, /tripCanary\('rule\.cross-board-write'/],
  'server/lib/syncRulePlan.js': [/for \(const ruleActionId of ruleActionIds\(rule\)\)/, /!ruleActionIds\(rule\)\.includes\(action\._id\)/],
  'server/lib/ruleHistory.js': [/snapshot\.extraTriggers = /, /snapshot\.extraActions = /, /rulesUsing\(field, id\)/],
  'models/boards.js': [/remapRuleParts\(rule, triggersMap, actionsMap\)/],
  'models/wekanCreator.js': [/remapRuleParts\(rule, this\.triggers, this\.actions\)/],
  'models/exporter.js': [/_id: \{ \$in: partTriggerIds\(rule\) \}/, /parts\.ruleActionIds\(d\)/],
  'server/models/rules.js': [/out\.extraTriggers = /, /out\.extraActions = /],
  'server/publications/rules.js': [/actionIds\.push\(\.\.\.ruleActionIds\(rule\)\)/],
  'client/components/rules/rulesImportExport.js': [/entry\.extraTriggers = extraTriggers/, /Meteor\.call\('rules\.addPart', created\._id/],
  'client/components/rules/ruleDetails.jade': [/each extraTriggers/, /js-add-rule-part/],
};
for (const [file, patterns] of Object.entries(checks)) {
  const text = read(file);
  for (const pattern of patterns) assert.match(text, pattern, `${file}: ${pattern}`);
}

console.log('  ok - rules keep several triggers (any fires) and several actions (in order)');
