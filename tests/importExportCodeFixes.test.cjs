'use strict';

// Faults found while documenting every import and export format
// (docs/Features/ImportExport/<format>/): each is pinned here so it cannot
// come back. Run: node tests/importExportCodeFixes.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatTasksOrgBackup, parseTasksOrgBackup } = await import('../models/lib/tasksorgFormat.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('Trello Butler: the list name keeps its case, so the rule fires on that list', () => {
    const js = read('client/components/rules/rulesImportExport.js');
    assert.match(js, /const added = line\.match\(\/when a card is added to list \["“\]\(\.\+\?\)\["”\]\.\*move the card to the \(top\|bottom\)\/i\);/);
    assert.doesNotMatch(js, /line\.toLowerCase\(\)\.match\(/, 'negative: no lowercased copy is matched for a name');
  });

  test('HTML export: the board JSON is fetched by URL, not read off a link the popup no longer has', () => {
    const js = read('client/lib/exportHTML.js');
    assert.doesNotMatch(js, /querySelector\('\.download-json-link'\)/);
    assert.match(js, /fetch\(`\/api\/boards\/\$\{encodeURIComponent\(boardId\)\}\/export\?\$\{params\.toString\(\)\}`\)/);
  });

  test('Nextcloud Deck: done, as a timestamp or as the API\'s true, marks the due date done', () => {
    const board = EXTERNAL_PARSERS.deck({ title: 'D', stacks: [{ title: 'S', cards: [
      { title: 'api', done: true, duedate: '2026-10-09T00:00:00Z' },
      { title: 'stamped', done: '2026-10-08T10:00:00Z', duedate: '2026-10-09T00:00:00Z' },
      { title: 'open', done: false },
    ] }] });
    const [api, stamped, open] = board.tasks;
    assert.equal(api.due_complete, true);
    assert.equal(api.date_end, undefined, 'true is not a date');
    assert.equal(stamped.due_complete, true);
    assert.equal(stamped.date_end, '2026-10-08T10:00:00Z');
    assert.equal(open.due_complete, undefined);
  });

  test('Tasks.org: time spent goes back as elapsedSeconds and imports again', () => {
    const backup = formatTasksOrgBackup({ board: { _id: 'b', title: 'B' }, lists: [{ _id: 'l', title: 'L' }],
      items: [{ cardId: 'c', title: 'Spent', listId: 'l', listTitle: 'L', spentTime: 1.5 }] }, new Date(Date.UTC(2026, 9, 9)));
    const task = backup.data.tasks[0].task;
    assert.equal(task.elapsedSeconds, 5400);
    assert.equal(parseTasksOrgBackup(backup).tasks[0].spent_hours, 1.5);
    const none = formatTasksOrgBackup({ board: { _id: 'b' }, lists: [], items: [{ cardId: 'c', title: 'x' }] }, new Date(0));
    assert.equal(none.data.tasks[0].task.elapsedSeconds, undefined, 'negative: nothing spent writes nothing');
  });

  test('api.py: exports with routes of their own are fetched there, and written as bytes', () => {
    const api = read('api.py');
    assert.match(api, /elif fmt == 'excel':\s*url = wekanurl \+ apiboards \+ boardid \+ s \+ 'exportExcel'/);
    assert.match(api, /elif fmt == 'pdf':\s*url = wekanurl \+ apiboards \+ boardid \+ s \+ 'exportPDF'/);
    assert.match(api, /params = \{'delimiter': \{'csv': ',', 'scsv': ';', 'tsv': '\\t'\}\[fmt\]\}/);
    assert.match(api, /with open\(outputpath, 'wb'\) as f:\s*f\.write\(response\.content\)/);
    assert.match(api, /def import_document\(source, filepath\):/);
  });

  console.log(`\nimportExportCodeFixes: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
