'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML4 and HTML5 rule writes share one exact-board service', () => {
  const service = read('server/lib/accessibleRuleOperations.js');
  const methods = read('server/rulesButton.js');
  const modern = read('client/components/rules/rulesList.js');
  const legacy = read('server/legacyHtml4.js');

  assert.match(service, /async function editableRule\(userId, ruleId, routeBoardId\)/);
  assert.match(service, /routeBoardId !== undefined && routeBoardId !== rule\.boardId/);
  assert.match(service, /tripCanary\('rule\.cross-board-write', \{ userId \}\)/);
  assert.match(service, /canDeleteBoardRule\(board, userId,/);
  assert.match(service, /title\.length > MAX_RULE_TITLE_LENGTH/);
  assert.match(service, /Rules\.updateAsync\(rule\._id, \{ \$set: \{ title \} \}\)/);
  for (const collection of ['Rules', 'Triggers', 'Actions']) {
    assert.match(service, new RegExp(`${collection}\\.removeAsync\\(`));
  }

  assert.match(methods, /'rules\.renameRule'[\s\S]*renameAccessibleRule\(this\.userId/);
  assert.match(methods, /'rules\.deleteRule'[\s\S]*removeAccessibleRule\(this\.userId/);
  assert.match(modern, /Meteor\.call\('rules\.renameRule'/);
  assert.doesNotMatch(modern, /Rules\.update\(/);
  assert.match(legacy, /renameAccessibleRule\(session\.userId/);
  assert.match(legacy, /removeAccessibleRule\(session\.userId/);
  assert.match(legacy, /boardId: decodeURIComponent\(rulesPath\[1\]\)/);
});

test('HTML4 board rules expose localized read views and guarded native controls', () => {
  const page = read('server/lib/legacyHtml4Pages.js');
  const start = page.indexOf('async function boardRulesPage');
  const end = page.indexOf('\nfunction tr(', start);
  const rules = page.slice(start, end);

  assert.ok(start >= 0 && end > start);
  assert.match(rules, /visibleBoard\(segment\(match\[1\]\), userId\)/);
  assert.match(rules, /Rules\.find\(\{ boardId: board\._id \}/);
  assert.match(rules, /localizedStoredRuleDescription\(/);
  assert.match(rules, /const canAdmin = !!\(user\?\.isAdmin \|\| board\.hasAdmin\(userId\)\)/);
  assert.match(rules, /if \(canAdmin\) \{/);
  assert.match(rules, /legacyOperation: 'rename-rule'/);
  assert.match(rules, /legacyOperation: 'confirm-delete-rule'/);
  assert.match(rules, /legacyOperation: 'delete-rule'/);
  assert.match(rules, /maxlength: 500/);
  assert.match(rules, /requestFields\.rulesView === 'workflow'/);
  assert.match(rules, /fields: \{ rulesView: workflow \? 'list' : 'workflow' \}/);
  assert.match(rules, /\? \[rule\.title, triggerText,/);
  assert.match(rules, /describe\(actionById\.get\(rule\.actionId\)\?\.desc\)/);
  assert.match(rules, /WORKFLOW_TRIGGERS\.map\(/);
  assert.match(rules, /WORKFLOW_ACTIONS\.map\(/);
  assert.match(rules, /legacyOperation: 'create-workflow-rule'/);
  assert.match(rules, /legacyOperation: 'replace-workflow-action'/);
  assert.match(page, /const rules = await boardRulesPage\(path, userId, requestFields, translate\)/);
  assert.match(page, /action: `\$\{boardPath\(board\)\}\/rules`/);
});
