'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Rules JSON and CSV imports validate a bounded whole batch before writing', () => {
  const transfer = read('models/lib/ruleTransfer.js');
  const service = read('server/lib/accessibleRuleOperations.js');
  assert.match(transfer, /function parseRuleTransferText\(text, format\)/);
  assert.match(transfer, /parsed\._format !== RULES_FORMAT/);
  assert.match(transfer, /Invalid Rules CSV fields at row/);
  assert.match(service, /MAX_RULE_IMPORT_BYTES = 1024 \* 1024/);
  assert.match(service, /MAX_RULE_IMPORT_COUNT = 1000/);
  assert.match(service, /RULE_TRIGGER_TYPES\.has\(trigger\.activityType\)/);
  assert.match(service, /RULE_ACTION_TYPES\.has\(action\.actionType\)/);
  assert.match(service, /secureTransfer\(parsed, \{[\s\S]*direction: 'import'/);
  const validation = service.indexOf('const entries = safe.map(importedRuleEntry)');
  const insertion = service.indexOf('for (const entry of entries)');
  assert.ok(validation > 0 && insertion > validation);
  assert.match(service, /Triggers\.removeAsync\(triggerId\)\.catch/);
  assert.match(service, /Actions\.removeAsync\(actionId\)\.catch/);
});

test('HTML4 and HTML5 submit Rules imports to the same server operation', () => {
  const modern = read('client/components/rules/rulesImportExport.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const renderer = read('imports/lib/legacyHtml4.js');
  const methods = read('server/rulesButton.js');
  assert.match(modern, /Meteor\.call\('rules\.importRules'/);
  assert.doesNotMatch(modern, /Meteor\.call\(\s*'rules\.createRule'/);
  assert.match(legacy, /requestFields\.legacyOperation === 'import-rules'/);
  assert.match(legacy, /importAccessibleRules\(session\.userId/);
  assert.match(page, /legacyOperation: 'import-rules'/);
  assert.match(page, /maxlength: 1024 \* 1024/);
  assert.match(renderer, /input\.type === 'textarea'/);
  assert.match(methods, /'rules\.importRules'[\s\S]*importAccessibleRules\(this\.userId/);
});
