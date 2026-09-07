'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Rules JSON and CSV share one structurally safe portable serializer', () => {
  const transfer = read('models/lib/ruleTransfer.js');
  const modern = read('client/components/rules/rulesImportExport.js');
  const server = read('server/lib/accessibleRuleExport.js');
  assert.match(transfer, /RULES_FORMAT = 'wekan-rules-1\.0\.0'/);
  assert.match(transfer, /STRIP_FIELDS = new Set\(\['_id', 'boardId', 'createdAt', 'modifiedAt', 'updatedAt'\]\)/);
  assert.match(transfer, /sanitizeTransferValue\([^]*direction: 'export'/);
  assert.match(transfer, /neutralizeSpreadsheetFormula\(String\(entry\.title/);
  assert.match(modern, /collectRuleTransferEntries\(/);
  assert.match(modern, /ruleTransferDocument\(boardId, collectBoardRules\(boardId\)\)/);
  assert.match(modern, /rulesToCsv\(collectBoardRules\(boardId\)\)/);
  assert.match(server, /collectRuleTransferEntries\(/);
  assert.match(server, /secureTransfer\(ruleTransferDocument\(boardId, entries\)/);
  assert.match(server, /RULE_EXPORT_FORMATS = new Set\(\['json', 'csv'\]\)/);
});

test('HTML4 Rules downloads are exact-route, visible-board and purpose bound', () => {
  const handler = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  const server = read('server/lib/accessibleRuleExport.js');
  assert.match(handler, /body\.legacyOperation === 'export-rules'/);
  assert.match(handler, /download:rules-\$\{boardId\}-\$\{format\}/);
  assert.match(handler, /requestFields\.boardId !== routeBoardId/);
  assert.match(handler, /serveAccessibleRulesExport\(/);
  assert.match(page, /legacyOperation: 'export-rules'/);
  assert.match(page, /authPurpose: `download:rules-\$\{board\._id\}-\$\{format\}`/);
  assert.match(server, /await assertExportEnabled\(\)/);
  assert.match(server, /canUserSeeBoard\(userId, boardId\)/);
  assert.match(server, /componentSelector\(triggerIds, boardId\)/);
  assert.match(server, /X-Content-Type-Options', 'nosniff'/);
});
