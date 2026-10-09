'use strict';

// Quire CSV import/export (models/lib/quireCsvFormat.js): the columns of
// Quire's Import CSV guide, the sample file that guide links (repeated ID
// columns by depth) and the API's export-csv example (an ID path "#6, #8").
// Run: node tests/quireCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// The first rows of Quire's sample file, as the guide's gist has them.
const SAMPLE = [
  '"ID","ID","ID",Name,Status,Started,Completed,Priority,Start,Due,Duration,Estimate,Time log,Variation,Assignee,Tag,Successors,Created,Created by,Description',
  '#1,,,Website,To-do,,,Medium,,,,,,,,,,"Jun 2, 2026",Peggy,',
  ',#2,,Homepage content update,Completed,,"Jun 2, 2026",High,"Dec 25, 2025","Jan 17, 2026",=J3 - I3,,,,,,,"Jun 2, 2026",Peggy,"Must have on our homepage:',
  '',
  '1. Proof',
  '1. Calls to action"',
  ',#3,,Homepage content update,To-do,,,High,,,,,,,,MKT,,"Jun 2, 2026",Peggy,',
  '#5,,,Blog Posts,To-do,,,Medium,,,,,,,,,,"Jun 2, 2026",Peggy,',
  ',#6,,Pet Care,To-do,,,Urgent,,,,,,,,,,"Jun 2, 2026",Peggy,',
  ',,#7,10 Essential Tips for First-Time Dog Owners,Completed,,"Jun 2, 2026",Medium,"Feb 19, 2026","Feb 23, 2026",=J8 - I8,,,,,,,"Jun 2, 2026",Peggy,"\'- Item 1',
  '- Item 2"',
  ',#9,,Diet,To-do,,,Medium,,,,,,,,,,"Jun 2, 2026",Peggy,',
  ',,#12,5 Simple Commands Every Dog Should Know,In progress,"Jun 2, 2026",,Medium,,"Jul 7, 2026",,,,,,,,"Jun 2, 2026",Peggy,',
].join('\n');

// The export-csv response example of Quire's API reference.
const API = [
  '"ID",Name,Status,Started,Completed,Priority,Start,Due,Assignee,Tag,Created,Created by,Description',
  '#6,Task A,In Progress,"Mar 8, 2022",,Medium,,"Mar 8, 2022",,,"Mar 7, 2022",John,',
  '"#6, #8",Task A1,To-Do,"Jan 24, 2022",,Urgent,,,,,"Mar 7, 2022",John,',
  '#7,Task B,In Progress,"Jan 24, 2022",,Urgent,,"Mar 4, 2022",,,"Mar 7, 2022",John,',
  '"#7, #9",Task B1,In Progress,"Jan 24, 2022",,Medium,,,,,"Mar 7, 2022",John,',
].join('\n');

async function main() {
  const { parseQuireCsv, formatQuireCsv, quireDate, quireDateText } = await import('../models/lib/quireCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { planImportedTask, planImportedLinks } = await import('../models/lib/importedTaskPlan.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('Quire\'s sample file: statuses, depth-by-column hierarchy, dates, priority, tags and the formula guard', () => {
    const board = parseQuireCsv(SAMPLE);
    assert.deepEqual(board.columns.map(c => c.title), ['To-do', 'Completed', 'In progress']);
    const byRef = Object.fromEntries(board.tasks.map(task => [task.ref, task]));
    assert.deepEqual(board.tasks.map(t => t.ref), ['#1', '#2', '#3', '#5', '#6', '#7', '#9', '#12']);
    assert.equal(byRef['#1'].parent_ref, undefined);
    assert.equal(byRef['#2'].parent_ref, '#1');
    assert.equal(byRef['#3'].parent_ref, '#1');
    assert.equal(byRef['#6'].parent_ref, '#5');
    assert.equal(byRef['#7'].parent_ref, '#6', 'the third ID column is a child of the nearest second-column task above');
    assert.equal(byRef['#9'].parent_ref, '#5');
    assert.equal(byRef['#12'].parent_ref, '#9');
    const two = byRef['#2'];
    assert.equal(two.description, 'Must have on our homepage:\n\n1. Proof\n1. Calls to action');
    assert.equal(two.date_started, '2025-12-25T00:00:00.000Z');
    assert.equal(two.date_due, '2026-01-17T00:00:00.000Z');
    assert.equal(two.date_end, '2026-06-02T00:00:00.000Z');
    assert.equal(two.date_creation, '2026-06-02T00:00:00.000Z');
    assert.equal(two.requested_by, 'Peggy');
    assert.deepEqual(two.custom_fields, { Priority: 'High' });
    assert.equal(byRef['#1'].custom_fields, undefined, 'Medium is Quire\'s default and is no value');
    assert.deepEqual(byRef['#6'].custom_fields, { Priority: 'Urgent' });
    assert.deepEqual(byRef['#3'].tags, ['MKT']);
    assert.equal(byRef['#7'].description, '- Item 1\n- Item 2', 'the leading \' of the formula guard is removed');
    assert.equal(byRef['#12'].date_started, '2026-06-02T00:00:00.000Z', 'Started stands in for an empty Start');
    // Every parent link resolves inside the import.
    assert.equal(planImportedLinks(board.tasks).parents.length, 6);
    assert.equal(planImportedTask(two).card.endAt.toISOString(), '2026-06-02T00:00:00.000Z');
    const columns = board.unsupported.filter(u => u.path.startsWith('/columns/')).map(u => u.path.slice(9));
    assert.deepEqual(columns.sort(), ['Duration', 'Estimate', 'Successors', 'Time log', 'Variation'].sort());
  });

  test('the API\'s export-csv example: an ID path names the parent', () => {
    const board = parseQuireCsv(API);
    assert.deepEqual(board.tasks.map(t => [t.ref, t.parent_ref]), [['#6', undefined], ['#8', '#6'], ['#7', undefined], ['#9', '#7']]);
    assert.deepEqual(board.columns.map(c => c.title), ['In Progress', 'To-Do']);
    assert.equal(board.tasks[1].date_started, '2022-01-24T00:00:00.000Z');
    assert.equal(board.tasks[0].date_due, '2022-03-08T00:00:00.000Z');
    assert.equal(board.unsupported.length, 0);
  });

  test('the import shape: Parent and ID, repeated or merged Assignee and Tag, numeric priorities', () => {
    const board = parseQuireCsv([
      'Name,Assignee,Assignee,Tag,Tag,Start,Due,Priority,Status,Description,Parent,ID',
      'Write importer,alice@example.com,bob,dev,"ui, api",2026-10-08,2026-10-10,2,In Progress,Parse CSV,,1',
      'Sub step,,,,,,,low,,,1,2',
      'Other,"carol, dave",,,,,,-1,Done,,,3',
    ].join('\n'));
    const [one, two, three] = board.tasks;
    assert.equal(one.ref, '#1');
    assert.equal(one.owner_username, 'alice@example.com');
    assert.deepEqual(one.assignees, ['bob']);
    assert.deepEqual(one.tags, ['dev', 'ui', 'api']);
    assert.equal(one.date_started, '2026-10-08T00:00:00.000Z');
    assert.deepEqual(one.custom_fields, { Priority: 'Urgent' });
    assert.equal(two.parent_ref, '#1');
    assert.equal(two.column_name, 'To-Do', 'a task without a status is To-Do');
    assert.deepEqual(two.custom_fields, { Priority: 'Low' });
    assert.equal(three.owner_username, 'carol');
    assert.deepEqual(three.assignees, ['dave']);
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
    assert.deepEqual(board.unsupported, []);
  });

  test('negative: unknown priorities, unreadable dates, nameless rows and a missing Name are reported, never guessed', () => {
    const board = parseQuireCsv(['Name,Priority,Due,Start,Started,Status,Owner', 'A,Critical,27/09/2026,"Feb 30, 2026",,Todo,x', ',High,,,,Todo,',
      'B,,,2026-10-01,2026-10-02,Todo,'].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/Priority Quire priority "Critical"/);
    assert.match(reasons, /\/row\/2\/Due Quire date "27\/09\/2026" could not be read/);
    assert.match(reasons, /\/row\/2\/Start Quire date "Feb 30, 2026"/, 'an impossible day is refused');
    assert.match(reasons, /\/row\/3 a Quire row without a name/);
    assert.match(reasons, /\/row\/4\/Started Quire's Started date is not kept/);
    assert.match(reasons, /\/columns\/Owner Quire column "Owner"/);
    assert.equal(board.tasks.length, 2);
    assert.equal(board.tasks[0].custom_fields, undefined);
    assert.equal(board.tasks[0].date_due, undefined);
    assert.equal(board.tasks[1].date_started, '2026-10-01T00:00:00.000Z', 'Start wins over Started');
    assert.equal(quireDate('2 Jun 2026'), '2026-06-02T00:00:00.000Z');
    assert.equal(quireDate('2026-06-02T10:30:00Z'), '2026-06-02T10:30:00.000Z');
    assert.equal(quireDate('06/02/2026'), undefined, 'a day/month order is never guessed');
    assert.equal(quireDateText('2026-06-02T00:00:00.000Z'), 'Jun 2, 2026');
    assert.throws(() => parseQuireCsv(''), /Quire CSV is empty/);
    assert.throws(() => parseQuireCsv('Title,State\nA,B'), /Name column/);
    assert.throws(() => parseQuireCsv('Name\n"open'), /Quire CSV has an unclosed quote/);
  });

  test('export writes Quire\'s import columns, repeated Assignee and Tag, and it imports back', () => {
    const csv = formatters.quire({
      items: [
        { cardId: 'c1', title: '=1+1', listTitle: 'In Progress', description: '- one\nline, "two"', owner: 'alice', assignees: ['bob'],
          labels: ['Bug', 'a,b', 'UI'], createdAt: '2026-10-01T00:00:00.000Z', startAt: '2026-10-02T00:00:00.000Z',
          dueAt: '2026-10-20T00:00:00.000Z', requestedBy: 'carol', customFields: { Priority: 'High' } },
        { cardId: 'c2', title: 'Child', listTitle: 'Completed', endAt: '2026-10-07T00:00:00.000Z', parentCardId: 'c1' },
        { cardId: 'c3', title: 'Orphan', listTitle: '', parentCardId: 'not-exported', customFields: { Priority: 'Whatever' } },
      ],
    });
    const lines = csv.split('\r\n');
    assert.equal(lines[0], 'ID,Parent,Name,Status,Completed,Priority,Start,Due,Assignee,Assignee,Tag,Tag,Tag,Created,Created by,Description');
    assert.ok(csv.includes("'=1+1"), 'text that looks like a formula is guarded');
    assert.ok(csv.includes('"Oct 20, 2026"'), 'dates are written the way Quire writes them');
    const back = parseQuireCsv(csv);
    const [one, two, three] = back.tasks;
    assert.equal(one.title, '=1+1');
    assert.equal(one.ref, '#1');
    assert.equal(one.description, '- one\nline, "two"');
    assert.equal(one.owner_username, 'alice');
    assert.deepEqual(one.assignees, ['bob']);
    assert.deepEqual(one.tags, ['Bug', 'a b', 'UI'], 'a comma inside a label cannot split it');
    assert.deepEqual(one.custom_fields, { Priority: 'High' });
    assert.equal(one.date_creation, '2026-10-01T00:00:00.000Z');
    assert.equal(one.date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(one.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(one.requested_by, 'carol');
    assert.equal(two.parent_ref, '#1');
    assert.equal(two.column_name, 'Completed');
    assert.equal(two.date_end, '2026-10-07T00:00:00.000Z');
    assert.equal(three.parent_ref, undefined, 'a parent outside the export is no parent');
    assert.equal(three.column_name, 'To-Do');
    assert.equal(three.custom_fields, undefined, 'an unknown priority exports as Medium');
    assert.deepEqual(back.unsupported, []);
    assert.equal(formatQuireCsv({ items: [] }).split('\r\n')[0], 'ID,Parent,Name,Status,Completed,Priority,Start,Due,Assignee,Tag,Created,Created by,Description');
  });

  test('wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.quire, parseQuireCsv);
    assert.equal(formatters.quire, formatQuireCsv);
    assert.doesNotThrow(() => validateImportSourceShape('quire', API));
    assert.throws(() => validateImportSourceShape('quire', '  '), /Invalid quire/);
    assert.match(read('models/import.js'), /case 'quire':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.quire\(importedBoard\);[\s\S]*?new KanboardCreator\(data, 'quire'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /quire: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'quire', name: 'Quire'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'quire', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'quire'[^}]*path: 'export\/quire', ext: 'csv'/);
    // The instruction is English, pending Transifex; until it is merged into
    // en.i18n.json it waits in the pending-keys file.
    const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
    const pendingFile = path.join(__dirname, '..', '.tools', 'tmp', 'new-i18n-keys.json');
    const instruction = en['import-board-instruction-quire']
      || (fs.existsSync(pendingFile) ? JSON.parse(fs.readFileSync(pendingFile, 'utf8'))['import-board-instruction-quire'] : undefined);
    assert.match(String(instruction), /Quire[\s\S]*Export CSV/);
  });

  console.log(`\nquireCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
