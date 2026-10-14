'use strict';

// #2217: an Admin Panel option, off by default, lets a board show its Rules to
// members read-only; the board admin ticks it per board.
// Run: node tests/rulesReadOnly.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { rulesAccess } = require('../models/lib/rulesReadOnly.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const on = { rulesReadOnlyForMembers: true };
const shown = { rulesVisibleToMembers: true };

// Positive.
assert.equal(rulesAccess({ setting: on, board: shown, isActiveMember: true }), 'read');
assert.equal(rulesAccess({ setting: {}, board: {}, isBoardAdmin: true }), 'edit', 'board admins edit as before');
assert.equal(rulesAccess({ setting: {}, board: {}, isSiteAdmin: true }), 'edit');
assert.equal(rulesAccess({ setting: on, board: shown, isBoardAdmin: true, isActiveMember: true }), 'edit');
console.log('  ok - both switches on: members read; admins edit');

// Negative: off by default, and each switch alone is not enough.
for (const [setting, board] of [[undefined, undefined], [{}, shown], [on, {}], [{ rulesReadOnlyForMembers: 'true' }, shown],
  [on, { rulesVisibleToMembers: 1 }]]) {
  assert.equal(rulesAccess({ setting, board, isActiveMember: true }), 'none');
}
assert.equal(rulesAccess({ setting: on, board: shown, isActiveMember: false }), 'none', 'never for a non-member');
console.log('  ok - off by default; one switch alone, or a non-member, sees nothing');

// The setting: site admin only, published, and the board field.
const methods = read('server/methods/instanceFeatures.js');
assert.match(methods, /async saveRulesReadOnlyForMembers\(enabled\) \{\s*await requireSiteAdmin\(\);\s*check\(enabled, Boolean\);/);
assert.match(read('server/publications/settings.js'), /rulesReadOnlyForMembers: 1,/);
assert.match(read('models/settings.js'), /rulesReadOnlyForMembers: \{\s*type: Boolean,\s*optional: true,/);
assert.match(read('models/boards.js'), /rulesVisibleToMembers: \{[\s\S]{0,300}type: Boolean,\s*optional: true,/);
console.log('  ok - the setting is site-admin only and the board field exists');

// UI: one access function everywhere; nothing that edits for a reader.
const main = read('client/components/rules/rulesMain.jade');
const readBranch = main.slice(main.indexOf("else if($eq rulesAccess 'read')"), main.indexOf('    +sidebar'));
assert.ok(readBranch.length > 0);
assert.doesNotMatch(readBranch, /rulesTriggers|rulesActions|rulesWorkflow|rulesBlocks|rulesBots|historyTable/, 'a reader gets the list and details only');
assert.match(main, /if\(\$eq rulesAccess 'edit'\)\s*\n\s*if\(\$eq rulesCurrentTab\.get 'rulesList'\)/);
assert.match(read('client/components/rules/rulesList.js'), /canAdmin\(\) \{[\s\S]{0,300}return currentRulesAccess\(\) === 'edit';/);
const details = read('client/components/rules/ruleDetails.jade');
for (const m of details.matchAll(/button\.js-(add|remove)-rule-part/g)) {
  const before = details.slice(0, m.index).split('\n').slice(-2).join('\n');
  assert.match(before, /if canEditRules/, 'every add/remove button is behind canEditRules');
}
const menu = read('client/components/sidebar/sidebar.jade');
const popup = menu.slice(menu.indexOf('template(name="boardMenuPopup")'));
assert.match(popup, /\n  if currentUser\.isBoardAdmin\n[\s\S]*?\n  else if rulesReadable\n[\s\S]*?a\.js-open-rules-view[\s\S]*?\n  if currentUser\n/,
  'the member entry is the else of the WHOLE admin block, so no admin entry leaks to it');
const readable = popup.slice(popup.indexOf('  else if rulesReadable'), popup.indexOf('\n  if currentUser\n'));
assert.equal((readable.match(/a\.js-/g) || []).length, 1, 'a reader gets exactly one entry: Rules');
assert.match(read('client/components/rules/rulesList.jade'), /if canAdmin\s*\n\s*if rulesForMembersOffered\s*\n\s*a\.flex\.js-toggle-rules-visible-to-members/);
console.log('  ok - readers get the rules list and details with no edit control');

console.log('\nrulesReadOnly: all tests passed');
