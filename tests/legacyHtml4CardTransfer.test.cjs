'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('card and checklist exports share one scoped HTML4 exporter', () => {
  const service = read('server/lib/legacyHtml4ScopedExport.js');
  const route = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(service, /async function serveLegacyHtml4ScopedExport/);
  assert.match(service, /assignedOnlyCardScope\(board, userId\)/);
  assert.match(service, /const scope = checklistId \? \{ checklistId \} : \{ cardId \}/);
  assert.match(service, /const kind = checklistId \? 'checklist' : 'card'/);
  assert.match(route, /legacyOperation === 'export-card'/);
  assert.match(route, /\['export-rules', 'export-card', 'export-checklist'/);
  assert.match(route, /body\.legacyOperation === 'export-card'/);
  assert.match(route, /serveLegacyHtml4ScopedExport\(/);
  assert.match(route, /legacyOperation === 'export-checklist'/);
  assert.match(page, /legacyOperation: 'export-card'/);
  assert.match(page, /submitLabel: tr\(translate, 'export-card'/);
});

test('card and checklist imports share exact assigned-only target validation', () => {
  const service = read('server/lib/legacyHtml4Imports.js');
  const route = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(service, /export async function importLegacyHtml4ScopedFile/);
  assert.match(service, /assignedOnlyCardScope\(board, userId\)/);
  assert.match(service, /target\.checklistId && !checklist/);
  assert.match(service, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(service, /secureTransfer\(document/);
  assert.match(service, /withDeadline\(importer\.run\(\)/);
  assert.match(route, /\['import-card-file', 'import-checklist-file'\]/);
  assert.match(route, /legacyHtml4:checklist-import/);
  assert.match(route, /legacyHtml4:card-import/);
  assert.match(route, /refused card import with mismatched board or card scope/);
  assert.match(page, /legacyOperation: 'import-card-file'/);
  assert.match(page, /accept: '\.json,application\/json,\.zip,application\/zip'/);
});

test('card transfer widgets remain semantic labelled shared components', () => {
  const components = read('imports/lib/uiComponentLibrary.js');
  const renderer = read('imports/lib/legacyHtml4.js');
  assert.match(components, /function uiExportForm/);
  assert.match(components, /function uiFileForm/);
  assert.match(renderer, /cell\.component === 'export'/);
  assert.match(renderer, /cell\.component === 'file'/);
  assert.match(renderer, /<label for=/);
  assert.match(renderer, /type="checkbox"/);
});
