'use strict';

// Linear CSV import/export (models/lib/linearCsvFormat.js): the export columns
// of Linear's help, read the way Linear's own CSV importer (@linear/import)
// reads them. Run: node tests/linearCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const HEADER = 'ID,Team,Title,Description,Status,Estimate,Priority,Project ID,Project,Creator,Assignee,Labels,Cycle Number,Cycle Name,Cycle Start,Cycle End,Created,Updated,Started,Triaged,Completed,Canceled,Archived,Due Date,Parent issue,Initiatives,Project Milestone ID,Project Milestone,SLA Status';
const row = values => HEADER.split(',').map(name => {
  const value = values[name] === undefined ? '' : String(values[name]);
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}).join(',');

async function main() {
  const { parseLinearCsv, formatLinearCsv, linearDate, LINEAR_COLUMNS } = await import('../models/lib/linearCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { planImportedTask, planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  const CSV = [HEADER,
    row({ ID: 'ENG-42', Team: 'Engineering', Title: 'Login button misaligned', Description: 'Overlaps footer on mobile', Status: 'In Progress',
      Estimate: 3, Priority: 'High', Project: 'Website', Creator: 'Jane Doe', Assignee: 'John Smith', Labels: 'Bug, UI', 'Cycle Number': 7,
      Created: '2026-09-27T14:03:00.000Z', Updated: '2026-10-01T09:15:00.000Z', Started: '2026-09-28T08:00:00.000Z', 'Due Date': '2026-10-05' }),
    row({ ID: 'ENG-43', Team: 'Engineering', Title: "'=SUM(A1)", Status: 'Done', Priority: 'No priority', Completed: '2026-10-02T10:00:00.000Z', 'Parent issue': 'ENG-42' }),
    row({ ID: 'OPS-1', Team: 'Ops', Title: 'Old', Status: 'Canceled', Canceled: '2026-09-01T00:00:00.000Z', Archived: '2026-09-02T00:00:00.000Z' }),
  ].join('\n');

  test('a Linear export maps statuses, teams, issues, people, labels, dates, parent and custom fields', () => {
    const board = parseLinearCsv(CSV);
    assert.deepEqual(board.columns.map(c => c.title), ['In Progress', 'Done', 'Canceled']);
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Engineering', 'Ops'], 'teams are swimlanes');
    const [eng42, eng43, ops1] = board.tasks;
    assert.equal(eng42.ref, 'ENG-42');
    assert.equal(eng42.swimlane_name, 'Engineering');
    assert.equal(eng42.owner_username, 'John Smith');
    assert.equal(eng42.requested_by, 'Jane Doe');
    assert.deepEqual(eng42.tags, ['Bug', 'UI']);
    assert.equal(eng42.date_creation, '2026-09-27T14:03:00.000Z');
    assert.equal(eng42.date_started, '2026-09-28T08:00:00.000Z');
    assert.equal(eng42.date_due, '2026-10-05T00:00:00.000Z');
    assert.deepEqual(eng42.custom_fields, { Priority: 'High', Estimate: 3, Project: 'Website', Cycle: 'Cycle 7' });
    assert.equal(eng43.title, '=SUM(A1)', 'Linear\'s formula guard is removed');
    assert.equal(eng43.parent_ref, 'ENG-42');
    assert.equal(eng43.date_end, '2026-10-02T10:00:00.000Z');
    assert.equal(eng43.custom_fields, undefined, '"No priority" is no value');
    assert.equal(ops1.archived, true);
    assert.equal(ops1.date_end, '2026-09-01T00:00:00.000Z');
    assert.equal(ops1.custom_fields.Canceled, true);
    assert.equal(planImportedTask(ops1).card.archived, true);
    // The parent link resolves inside the import.
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
    // Reported once each, by name.
    const columns = board.unsupported.filter(u => u.path.startsWith('/columns/')).map(u => u.path.slice(9));
    assert.deepEqual(columns.sort(), ['Cycle End', 'Cycle Start', 'Initiatives', 'Project Milestone', 'Project Milestone ID', 'SLA Status', 'Triaged', 'Updated'].sort());
  });

  test('negative: unknown priorities, estimates and dates are reported, never guessed', () => {
    const board = parseLinearCsv(['Title,Status,Priority,Estimate,Created', 'A,Todo,Critical,lots,27/09/2026', ',Todo,,,'].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/Priority Linear priority "Critical"/);
    assert.match(reasons, /\/row\/2\/Estimate Linear estimate "lots"/);
    assert.match(reasons, /\/row\/2\/Created Linear date "27\/09\/2026"/);
    assert.match(reasons, /\/row\/3 a Linear row without a title/);
    assert.equal(board.tasks.length, 1);
    assert.equal(board.tasks[0].custom_fields, undefined);
    assert.equal(linearDate('2026-02-30'), undefined, 'an impossible day is refused');
    assert.throws(() => parseLinearCsv(''), /empty/);
    assert.throws(() => parseLinearCsv('Name,State\nA,B'), /Title and Status/);
  });

  test('export writes Linear\'s columns with its formula guard, and it imports back', () => {
    const csv = formatters.linear({
      items: [
        { cardId: 'c1', title: '-1 day off', listTitle: 'Todo', swimlaneTitle: 'Engineering', description: 'Line one\nline, two',
          owner: 'alice', creator: 'bob', labels: ['Bug', 'a,b'], createdAt: '2026-10-01T00:00:00.000Z', dueAt: '2026-10-20T00:00:00.000Z',
          customFields: { Priority: 'Urgent', Estimate: 5, Project: 'Web', Cycle: 'Sprint 3' } },
        { cardId: 'c2', title: 'Child', listTitle: 'Done', swimlaneTitle: 'Default', endAt: '2026-10-07T00:00:00.000Z', parentCardId: 'c1' },
        { cardId: 'c3', title: 'Dropped', listTitle: 'Canceled', endAt: '2026-10-08T00:00:00.000Z', customFields: { Canceled: true } },
      ],
    });
    assert.equal(csv.split('\r\n')[0], LINEAR_COLUMNS.join(','));
    assert.ok(csv.includes("'-1 day off"), 'text that looks like a formula is guarded');
    const back = parseLinearCsv(csv);
    const [one, two, three] = back.tasks;
    assert.equal(one.title, '-1 day off');
    assert.equal(one.description, 'Line one\nline, two');
    assert.equal(one.swimlane_name, 'Engineering');
    assert.deepEqual(one.tags, ['Bug', 'a b'], 'a comma inside a label cannot split it');
    assert.deepEqual(one.custom_fields, { Priority: 'Urgent', Estimate: 5, Project: 'Web', Cycle: 'Sprint 3' });
    assert.equal(one.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(two.parent_ref, 'c1');
    assert.equal(two.swimlane_name, 'Default', 'the Default swimlane is no team');
    assert.equal(two.date_end, '2026-10-07T00:00:00.000Z');
    assert.equal(three.custom_fields.Canceled, true, 'a canceled card exports as Canceled');
  });

  test('wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.linear, parseLinearCsv);
    assert.equal(formatters.linear, formatLinearCsv);
    assert.match(read('models/import.js'), /case 'linear':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.linear\(importedBoard\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /linear: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'linear', name: 'Linear'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'linear', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'linear'[^}]*path: 'export\/linear', ext: 'csv'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-linear'], /Export data/);
  });

  console.log(`\nlinearCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
