'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML4 renders the whole typed trigger/action catalog as staged forms', () => {
  const page = read('server/lib/legacyHtml4Pages.js');
  const catalog = read('models/lib/ruleParameterizedCatalog.js');
  assert.match(page, /legacyOperation: 'select-parameterized-trigger'/);
  assert.match(page, /legacyOperation: 'select-parameterized-action'/);
  assert.match(page, /legacyOperation: 'create-parameterized-rule'/);
  assert.match(page, /PARAMETERIZED_TRIGGERS\.map/);
  assert.match(page, /PARAMETERIZED_ACTIONS\.map/);
  assert.match(page, /colspanLast: 3/);
  const renderer = read('imports/lib/legacyHtml4.js');
  assert.match(renderer, /options\.colspanLast/);
  assert.match(renderer, /colspan=/);
  for (const family of ['scheduled-calendar', 'card-button', 'send-email',
    'add-checklist-items', 'move-all-cards']) assert.match(catalog, new RegExp(`'${family}'`));
});

test('HTML4 and Meteor call one exact-board parameterized rule service', () => {
  const legacy = read('server/legacyHtml4.js');
  const methods = read('server/rulesButton.js');
  const service = read('server/lib/accessibleRuleOperations.js');
  assert.match(legacy, /createAccessibleParameterizedRule\(session\.userId/);
  assert.match(methods, /'rules\.createParameterizedRule'[\s\S]*createAccessibleParameterizedRule\(this\.userId/);
  assert.match(service, /const board = await editableBoard\(userId, input\.boardId\)/);
  assert.match(service, /source: 'rules:parameterized-builder'/);
  assert.match(service, /boardHasLabel\(board, trigger\.labelId\)/);
  assert.match(service, /allowIsBoardMemberWithWriteAccess\(userId, destination\)/);
  assert.match(service, /CARD_COLORS\.includes\(action\.selectedColor\)/);
  assert.match(service, /insertRuleTuple\(board\._id/);
});
