'use strict';

// MeisterTask project CSV import/export (models/lib/meistertaskCsvFormat.js).
// The import shape is MeisterTask's own sample file (import-example.csv); the
// export header is the one in MeisterTask's export help article.
// Run: node tests/meistertaskCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// MeisterTask's import sample, as published.
const IMPORT_SAMPLE = [
  'project,section,name,notes,due_date,status,tags',
  'My Project,TODO,Some task 1,some notes on my task,2021-04-26T07:35:13+00:00,1,one tag; another tag',
  'My Project,TODO,Some task 2,,,1,one tag ',
  'My Project,In Progress,Some task 3,,,1,',
  'My Project,Done,Some task 4,,,2,another tag',
].join('\n');

// The export header, with values in its documented formats.
const EXPORT_SAMPLE = [
  'id,token,name,notes,created_at,updated_at,status,due_date,status_updated_at,assignee,section,tags',
  '12217697,mgbVt46x,Homepage Video,,2017-06-01T09:44:36+02:00,2017-06-01T09:44:36+02:00,1,,2017-06-01T09:44:36+02:00,John Demo,Website Marketing,Urgent',
  '12217704,o0EVUUY8,Select Agency,"Limit to SF, LA",2017-06-01T09:44:39+02:00,2017-06-01T09:47:20+02:00,2,2017-05-29,2017-06-01T09:47:20+02:00,Conor Larkin,Promo Video,',
  '12217705,p1FWVVZ9,Old idea,,2017-06-01T09:44:40+02:00,,16,,,,Promo Video,',
].join('\r\n');

async function main() {
  const { parseMeisterTaskCsv, formatMeisterTaskCsv, meistertaskDate, MEISTERTASK_IMPORT_COLUMNS } =
    await import('../models/lib/meistertaskCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('MeisterTask\'s own import sample maps to lists, cards, notes, due date, status and tags', () => {
    const board = parseMeisterTaskCsv(IMPORT_SAMPLE);
    assert.equal(board.board.name, 'My Project');
    assert.deepEqual(board.columns.map(c => c.title), ['TODO', 'In Progress', 'Done']);
    assert.equal(board.tasks.length, 4);
    const [first, second, , fourth] = board.tasks;
    assert.equal(first.title, 'Some task 1');
    assert.equal(first.description, 'some notes on my task');
    assert.equal(first.date_due, '2021-04-26T07:35:13.000Z');
    assert.deepEqual(first.tags, ['one tag', 'another tag']);
    assert.deepEqual(second.tags, ['one tag'], 'a trailing space is not a tag');
    assert.equal(fourth.column_name, 'Done');
    assert.equal(fourth.date_end, undefined, 'the import shape has no completion date to keep');
    assert.deepEqual(board.unsupported, []);
  });

  test('the export header: id, assignee, created date, completion, archived, quoted notes', () => {
    const board = parseMeisterTaskCsv(EXPORT_SAMPLE);
    assert.equal(board.board.name, 'Imported MeisterTask', 'the export carries no project column');
    const [video, agency, idea] = board.tasks;
    assert.equal(video.ref, '12217697');
    assert.equal(video.owner_username, 'John Demo');
    assert.equal(video.date_creation, '2017-06-01T07:44:36.000Z', 'the +02:00 offset is applied');
    assert.deepEqual(video.tags, ['Urgent']);
    assert.equal(agency.description, 'Limit to SF, LA');
    assert.equal(agency.date_due, '2017-05-29T00:00:00.000Z');
    assert.equal(agency.date_end, '2017-06-01T07:47:20.000Z', 'completed: status_updated_at is the end date');
    assert.equal(idea.archived, true, 'status 16 is archived');
    assert.equal(planImportedTask(idea).card.archived, true);
    assert.deepEqual(board.unsupported, []);
  });

  test('negative: unknown columns, statuses and dates are reported, never guessed', () => {
    const board = parseMeisterTaskCsv([
      'name,section,status,due_date,checklists,time_tracked',
      'A,S,4,26.04.2021,x,1h',
      ',S,1,,,',
    ].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/columns\/checklists /);
    assert.match(reasons, /\/columns\/time_tracked /);
    assert.match(reasons, /\/row\/2\/status MeisterTask status "4"/);
    assert.match(reasons, /\/row\/2\/due_date MeisterTask date "26\.04\.2021"/);
    assert.match(reasons, /\/row\/3 a MeisterTask row without a name/);
    assert.equal(board.tasks.length, 1);
    assert.equal(board.tasks[0].date_due, undefined);
    assert.equal(meistertaskDate('2021-02-30'), undefined, 'an impossible day is refused');
    assert.throws(() => parseMeisterTaskCsv(''), /empty/);
    assert.throws(() => parseMeisterTaskCsv('title,list\nA,B'), /name and section/);
    assert.throws(() => parseMeisterTaskCsv('name,section\n"A,B'), /MeisterTask CSV has an unclosed quote/);
    assert.throws(() => validateImportSourceShape('meistertask', '  '), /Invalid meistertask/);
  });

  test('export writes MeisterTask\'s import shape, and it imports back', () => {
    const csv = formatters.meistertask({
      board: { title: 'Launch' },
      items: [
        { title: 'Order, valves', listTitle: 'To do', description: 'Two "big" ones', dueAt: '2026-10-20T08:30:00.000Z', labels: ['Purchasing', 'a;b'] },
        { title: 'Ship it', listTitle: 'Done', endAt: '2026-10-07T00:00:00.000Z' },
      ],
    });
    assert.equal(csv.split('\r\n')[0], MEISTERTASK_IMPORT_COLUMNS.join(','));
    const back = parseMeisterTaskCsv(csv);
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    assert.equal(back.tasks[0].title, 'Order, valves');
    assert.equal(back.tasks[0].description, 'Two "big" ones');
    assert.equal(back.tasks[0].date_due, '2026-10-20T08:30:00.000Z');
    assert.deepEqual(back.tasks[0].tags, ['Purchasing', 'a,b'], 'a ; inside a tag cannot split it');
    assert.ok(csv.includes(',Done,Ship it,,,2,'), 'a card with an end date is completed (status 2)');
  });

  test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.meistertask, parseMeisterTaskCsv);
    assert.equal(formatters.meistertask, formatMeisterTaskCsv);
    assert.match(read('models/import.js'), /case 'meistertask':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.meistertask\(importedBoard\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /meistertask: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'meistertask', name: 'MeisterTask'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'meistertask', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'meistertask'[^}]*path: 'export\/meistertask', ext: 'csv'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-meistertask'], /Export project/);
    // Todoist's reader is shared and still names Todoist in its own errors.
    return import('../models/lib/todoistCsvFormat.js').then(({ readCsv }) => {
      assert.throws(() => readCsv('"a'), /Todoist CSV has an unclosed quote/);
    });
  });

  console.log(`\nmeistertaskCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
