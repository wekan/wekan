'use strict';

// Import loss reporting (models/lib/importLossReport.js).
// Run: node tests/importLossReport.test.cjs
//
// Every external parser and the shared planner return `unsupported` and
// `warnings` entries, but nothing stored them, so an import that dropped a
// board's sharing rules or a parent outside the file looked exactly like a
// complete one. The creators now record one bounded Recovery row per import
// with losses, and none for a complete import.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { importLossReport, IMPORT_WARNINGS_EVENT } = await import('../models/lib/importLossReport.js');

  const report = importLossReport({
    source: 'deck',
    warnings: [{ path: '/stacks/0/cards', reason: '1 deleted card(s) skipped' }],
    unsupported: [{ path: '/acl', reason: '1 sharing rule(s)' }, { path: '/x/attachments', reason: '2 attachment(s)' }],
  });
  assert.equal(report.type, IMPORT_WARNINGS_EVENT);
  assert.equal(report.type, 'import-completed-with-warnings');
  assert.equal(report.severity, 'warning');
  assert.equal(report.count, 3);
  assert.equal(report.detail,
    'deck: 2 not imported, 1 warning(s). /acl 1 sharing rule(s); /x/attachments 2 attachment(s); /stacks/0/cards 1 deleted card(s) skipped');

  // Negative: a complete import records nothing.
  for (const none of [undefined, {}, { source: 'x', warnings: [], unsupported: [] }, { unsupported: [null, {}] }, { unsupported: 'x' }]) {
    assert.equal(importLossReport(none), null);
  }

  // Bounded: a huge source cannot grow one row without limit.
  const many = importLossReport({ source: 'zenkit', unsupported: Array.from({ length: 500 }, (_, i) => ({ path: `/items/${i}`, reason: 'r'.repeat(1000) })) });
  assert.equal(many.count, 500);
  assert.match(many.detail, /; and 480 more$/);
  assert.ok(many.detail.length < 20 * 420, `detail is bounded (${many.detail.length})`);

  // Both external-import creators record it after the board exists.
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const kanboard = read('models/kanboardCreator.js');
  assert.match(kanboard, /await this\.createCards\(board, boardId\);\s*await recordImportLosses\(\{/);
  assert.match(kanboard, /this\.losses\.push\(\.\.\.customFieldPlan\.unsupported\)/);
  assert.match(kanboard, /this\.losses\.push\(\.\.\.unsupported\)/);
  const jira = read('models/jiraCreator.js');
  assert.match(jira, /await recordImportLosses\(\{\s*source: 'jira',\s*warnings: jiraPageWarnings\(board\)/);
  const importJs = read('models/import.js');
  // kanboard, markdown, todotxt, leo (the Leo outline) and the shared default branch.
  assert.equal((importJs.match(/new KanboardCreator\(data, /g) || []).length, 5, 'every KanboardCreator knows its source');
  assert.doesNotMatch(importJs, /new KanboardCreator\(data\)/);
  const children = read('models/lib/importedCardChildren.js');
  assert.match(children, /RecoveryEvents\.record\(report\.type/);
  assert.match(read('models/recoveryEvents.js'), /IMPORT_COMPLETED_WITH_WARNINGS: 'import-completed-with-warnings'/);

  console.log('  ok - imports with losses record one bounded Recovery row; complete imports record none');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
