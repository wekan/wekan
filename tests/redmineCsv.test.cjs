'use strict';

// Redmine issues CSV import/export (models/lib/redmineCsvFormat.js): the CSV
// Redmine's query_to_csv writes (BOM, ',' or ';', English captions, "#"
// first, "Related issues" in one cell) and the per-type relation columns its
// issue importer maps. Run: node tests/redmineCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { parseRedmineCsv, formatRedmineCsv, redmineDate, redmineSeparator, REDMINE_EXPORT_COLUMNS } = await import('../models/lib/redmineCsvFormat.js');
  const { readCsv } = await import('../models/lib/todoistCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  // The research sample: an English, project-scoped "All columns" subset.
  const SAMPLE = '﻿' + [
    '#,Tracker,Status,Priority,Subject,Author,Assignee,Updated,Category,Target version,Start date,Due date,Estimated time,% Done,Created,Related issues,Files,Description',
    '42,Bug,In Progress,High,Login button misaligned,Jane Doe,John Smith,10/01/2026 09:15 AM,UI,1.2,09/28/2026,10/05/2026,3.00,50,09/27/2026 02:03 PM,Blocked by #41,screenshot.png,"Button overlaps the footer on mobile."',
    '41,Feature,New,Normal,Responsive footer,Jane Doe,,09/27/2026 01:00 PM,UI,1.2,,,,0,09/27/2026 01:00 PM,Blocks #42,,',
  ].join('\r\n');

  test('a Redmine export maps statuses, trackers, people, dates, custom fields and one dependency per pair', () => {
    const board = parseRedmineCsv(SAMPLE);
    assert.deepEqual(board.columns.map(c => c.title), ['In Progress', 'New']);
    const [i42, i41] = board.tasks;
    assert.equal(i42.ref, '42');
    assert.equal(i42.title, 'Login button misaligned');
    assert.equal(i42.description, 'Button overlaps the footer on mobile.');
    assert.deepEqual(i42.tags, ['Bug']);
    assert.equal(i42.owner_username, 'John Smith');
    assert.equal(i42.requested_by, 'Jane Doe');
    assert.equal(i42.date_started, '2026-09-28T00:00:00.000Z');
    assert.equal(i42.date_due, '2026-10-05T00:00:00.000Z');
    assert.equal(i42.date_creation, '2026-09-27T14:03:00.000Z', '02:03 PM is 14:03');
    assert.deepEqual(i42.custom_fields, { Priority: 'High', Category: 'UI', 'Target version': '1.2', 'Estimated time': 3, '% Done': 50 });
    assert.deepEqual(i42.dependencies, [{ ref: '41', type: 'is-blocked-by' }]);
    assert.equal(i41.dependencies, undefined, '"Blocks #42" on #41 is the same relation and is kept once');
    assert.deepEqual(planImportedLinks(board.tasks).dependencies, [{ index: 0, deps: [{ target: 1, type: 'is-blocked-by' }] }]);
    const fields = planImportedCustomFields(board.tasks).fields;
    assert.equal(fields.find(f => f.name === 'Estimated time').type, 'number');
    const reported = board.unsupported.map(u => u.path);
    assert.ok(reported.includes('/columns/Updated') && reported.includes('/columns/Files'));
  });

  test('";" separator, BOM, d.m.Y dates, comma decimals, custom-field columns and the parent id', () => {
    const csv = '﻿' + [
      '#;Project;Tracker;Status;Subject;Assignee;Watchers;Parent task;Start date;Closed;Estimated time;Spent time;Last notes;Customer',
      '7;Web;Bug;Closed;"Fix; then deploy";Anna;"Bob\nCarl";;01.10.2026;03.10.2026 17:45;2,50;1,25;Done now;ACME',
      '8;Web;Support;Closed;Child;;;7;;;;;;',
    ].join('\n');
    assert.equal(redmineSeparator(csv), ';');
    const board = parseRedmineCsv(csv);
    const [seven, eight] = board.tasks;
    assert.equal(seven.title, 'Fix; then deploy');
    assert.equal(seven.swimlane_name, 'Web');
    assert.deepEqual(seven.watchers, ['Bob', 'Carl']);
    assert.equal(seven.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(seven.date_end, '2026-10-03T17:45:00.000Z');
    assert.equal(seven.spent_hours, 1.25);
    assert.deepEqual(seven.comments, [{ text: 'Done now' }]);
    assert.deepEqual(seven.custom_fields, { 'Estimated time': 2.5, Customer: 'ACME' }, 'an unknown column is a Redmine custom field');
    assert.equal(planImportedTask(seven).card.spentTime, 1.25);
    assert.equal(eight.parent_ref, '7');
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
  });

  test('the importer\'s per-type relation columns and field keys; lossy relation types are reported', () => {
    const board = parseRedmineCsv([
      'unique_id,subject,status,Blocked by,Precedes,Related to,Is duplicate of',
      'A,First,New,,B 3d,,',
      'B,Second,New,"#77, A",,,A',
      'C,Third,New,,,"A, B",',
    ].join('\n'));
    const [a, b, c] = board.tasks;
    assert.equal(a.ref, 'A');
    assert.deepEqual(a.dependencies, [{ ref: 'B', type: 'related-to' }]);
    assert.deepEqual(b.dependencies, [{ ref: '77', type: 'is-blocked-by' }, { ref: 'A', type: 'is-blocked-by' }, { ref: 'A', type: 'duplicates' }]);
    assert.deepEqual(c.dependencies, [{ ref: 'A', type: 'related-to' }, { ref: 'B', type: 'related-to' }]);
    const reasons = board.unsupported.map(u => u.reason).join('\n');
    assert.match(reasons, /"Precedes" has no WeKan type/);
    assert.match(reasons, /delay of Redmine relation "Precedes" \(3\)/);
    // #77 is not in this file: reported when the links are planned.
    assert.ok(planImportedLinks(board.tasks).unsupported.some(u => /not part of this import/.test(u.reason)));
  });

  test('negative: localized headers are refused, unknown dates, numbers and relations are reported', () => {
    // German Redmine: "#;Tracker;Status;Priorität;Thema;..." - only "#", Tracker and Status are shared words.
    assert.throws(() => parseRedmineCsv('Nº;Tipo;Estado;Asunto\n1;Error;Nueva;Algo'), /not Redmine's English column names[\s\S]*language/);
    assert.throws(() => parseRedmineCsv('﻿№,Трекер,Статус,Тема\n1,Ошибка,Новая,Что-то'), /English/);
    assert.throws(() => parseRedmineCsv('#;Tracker;Status;Thema\n1;Fehler;Neu;Etwas'), /needs the Subject column/);
    assert.throws(() => parseRedmineCsv(''), /empty/);
    const board = parseRedmineCsv([
      'Subject,Status,Due date,Estimated time,% Done,Related issues',
      'A,New,Oct 5 2026,lots,half,"Blocked by #2, Depends on #3"',
      ',New,,,,',
    ].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2\/Due date Redmine date "Oct 5 2026"/);
    assert.match(reasons, /Estimated time "lots" is not a number/);
    assert.match(reasons, /% Done "half" is not a number/);
    assert.match(reasons, /relation "Depends on #3" is not one of Redmine's English relation names/);
    assert.match(reasons, /\/row\/3 a Redmine row without a subject/);
    assert.equal(board.tasks.length, 1);
    assert.equal(redmineDate('02/30/2026'), undefined, 'an impossible day is refused');
    assert.equal(redmineDate('13:00 PM'), undefined);
    assert.equal(redmineDate('10/05/2026 13:00 PM'), undefined, 'a 12-hour time past 12 is refused');
    assert.equal(redmineDate('2026-10-05T10:00:00+02:00'), '2026-10-05T08:00:00.000Z');
    assert.equal(redmineDate('2026/10/05'), '2026-10-05T00:00:00.000Z');
    assert.equal(redmineDate('05-10-2026'), '2026-10-05T00:00:00.000Z');
  });

  test('a day-first file is read day first when one of its dates proves it', () => {
    const board = parseRedmineCsv(['Subject,Status,Start date,Due date', 'A,New,02/10/2026,25/10/2026'].join('\n'));
    assert.equal(board.tasks[0].date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(board.tasks[0].date_due, '2026-10-25T00:00:00.000Z');
  });

  test('readCsv keeps "," as its default separator', () => {
    assert.deepEqual(readCsv('a;b,c\n'), [['a;b', 'c']]);
    assert.deepEqual(readCsv('a;b,c\n', 'X', ';'), [['a', 'b,c']]);
  });

  test('export writes the English columns Redmine\'s importer maps, and it imports back', () => {
    const csv = formatters.redmine({
      items: [
        { cardId: 'c1', title: 'Parent "one"', listTitle: 'In Progress', swimlaneTitle: 'Web', description: 'Line one\nline, two',
          owner: 'alice', creator: 'bob', requestedBy: 'carol', labels: ['Bug', 'UI'], startAt: '2026-10-01T00:00:00.000Z',
          dueAt: '2026-10-20T00:00:00.000Z', createdAt: '2026-09-30T08:05:00.000Z', spentTime: 1.5,
          customFields: { Priority: 'High', Category: 'Frontend', 'Target version': '2.0', 'Estimated time': 4, '% Done': 30, Customer: 'ACME' },
          dependencies: [{ cardId: 'c2', type: 'blocks' }, { cardId: 'gone', type: 'blocks' }] },
        { cardId: 'c2', title: 'Child', listTitle: 'Closed', swimlaneTitle: 'Default', endAt: '2026-10-07T12:00:00.000Z', parentCardId: 'c1',
          dependencies: [{ cardId: 'c1', type: 'related-to' }, { cardId: 'c1', type: 'fixes' }] },
      ],
    });
    assert.ok(csv.startsWith('﻿'), 'UTF-8 with a byte order mark, as Redmine writes it');
    const header = csv.slice(1).split('\r\n')[0];
    assert.equal(header, REDMINE_EXPORT_COLUMNS.concat('Customer').join(','));
    assert.ok(header.includes('Blocked by') && header.includes('Unique ID') && !header.includes('Related issues'));
    const rows = readCsv(csv);
    const at = name => rows[0].indexOf(name);
    assert.equal(rows[1][at('Blocks')], 'c2', 'a relation to a card outside the export is left out');
    assert.equal(rows[1][at('Start date')], '2026-10-01', '%Y-%m-%d, the importer\'s first date format');
    assert.equal(rows[1][at('Estimated time')], '4.00');
    assert.equal(rows[1][at('Tracker')], 'Bug', 'Redmine has no labels; the first is the Tracker');
    assert.equal(rows[2][at('Parent task')], 'c1');
    assert.equal(rows[2][at('Related to')], 'c1, c1');

    const back = parseRedmineCsv(csv);
    const [one, two] = back.tasks;
    assert.equal(one.ref, 'c1');
    assert.equal(one.title, 'Parent "one"');
    assert.equal(one.description, 'Line one\nline, two');
    assert.equal(one.swimlane_name, 'Web');
    assert.deepEqual(one.tags, ['Bug']);
    assert.equal(one.owner_username, 'alice');
    assert.equal(one.requested_by, 'carol');
    assert.equal(one.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(one.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(one.date_creation, '2026-09-30T08:05:00.000Z');
    assert.equal(one.spent_hours, 1.5);
    assert.deepEqual(one.custom_fields, { Priority: 'High', Category: 'Frontend', 'Target version': '2.0', 'Estimated time': 4, '% Done': 30, Customer: 'ACME' });
    assert.deepEqual(one.dependencies, [{ ref: 'c2', type: 'blocks' }]);
    assert.equal(two.parent_ref, 'c1');
    assert.equal(two.swimlane_name, 'Default');
    assert.equal(two.date_end, '2026-10-07T12:00:00.000Z');
    assert.deepEqual(two.dependencies, [{ ref: 'c1', type: 'related-to' }]);
    assert.deepEqual(back.unsupported, []);
  });

  test('wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.redmine, parseRedmineCsv);
    assert.equal(formatters.redmine, formatRedmineCsv);
    assert.doesNotThrow(() => validateImportSourceShape('redmine', '#,Subject\n1,A'));
    assert.throws(() => validateImportSourceShape('redmine', '  '));
    assert.match(read('models/import.js'), /case 'redmine':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.redmine\(importedBoard\);[\s\S]*?new KanboardCreator\(data, 'redmine'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /redmine: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'redmine', name: 'Redmine'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'redmine', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'redmine'[^}]*path: 'export\/redmine', ext: 'csv'/);
    // Card dependencies reach the export when the Dependencies part is selected.
    assert.match(read('models/lib/externalExporters.js'), /want\('dependencies'\)[\s\S]{0,120}dependencies: c\.cardDependencies/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Redmine/Redmine.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Redmine\/Redmine\.md\)/);
  });

  console.log(`\nredmineCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
