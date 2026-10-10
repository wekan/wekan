'use strict';

// Teamwork.com Excel task import template (models/lib/teamworkFormat.js,
// server/lib/teamworkWorkbook.js), in the ten-column layout of Teamwork's
// help article on importing tasks from Excel. Run: node tests/teamworkFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ExcelJS = require('@wekanteam/exceljs');
const { readTeamworkWorkbook, writeTeamworkWorkbook } = require('../server/lib/teamworkWorkbook');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function workbook(name, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(name);
  rows.forEach(row => ws.addRow(row));
  return Buffer.from(await wb.xlsx.writeBuffer()).toString('base64');
}

const HEADER = ['Tasklist', 'Task', 'Description', 'Assign to', 'Start date', 'Due date', 'Priority', 'Estimated time', 'Tags', 'Status'];
// The template filled in the documented forms: subtask prefixes -, # and >,
// doubled for a deeper level; e-mail assignees and tags separated by commas;
// each documented estimate form; Active and Complete.
const TEMPLATE = [
  HEADER,
  ['Website', 'Design homepage', 'Hero and footer', 'ann@example.com, bob@example.com', new Date(Date.UTC(2026, 9, 1)), new Date(Date.UTC(2026, 9, 10)), 'high', '1h 15m', 'design, web', 'Active'],
  ['', '-Pick colours', '', 'bob@example.com', '', '', 'low', '25', '', 'Complete'],
  ['', '--Ask the client', '', '', '', '', '', '01:30', '', 'Active'],
  ['', '#Draw wireframe', '', '', '', '', 'medium', '1h', '', ''],
  ['Website', 'Write copy', '', '', '', '2026-10-12', '', '2 hours', '', 'Complete'],
  ['Launch', 'Plan launch', '', '', '', '', '', '', '', ''],
  ['', '>Announce', '', '', '', '', '', '', '', ''],
  ['', 'Celebrate', '', '', '', '', '', '', '', ''],
];

async function main() {
  const { parseTeamworkSheet, formatTeamworkSheet, teamworkEstimateMinutes, teamworkEstimateText, TEAMWORK_COLUMNS, ESTIMATE_FIELD } = await import('../models/lib/teamworkFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };

  await test('the template maps task lists, subtask prefixes, people, dates, priority, estimate, tags and status', async () => {
    const board = parseTeamworkSheet(await readTeamworkWorkbook(await workbook('Website relaunch', TEMPLATE)));
    assert.equal(board.board.name, 'Website relaunch');
    assert.deepEqual(board.columns.map(c => c.title), ['Website', 'Launch']);
    const [design, colours, client, wireframe, copy, plan, announce, celebrate] = board.tasks;
    assert.equal(board.tasks.length, 8);
    assert.equal(design.title, 'Design homepage');
    assert.equal(design.description, 'Hero and footer');
    assert.equal(design.owner_username, 'ann@example.com');
    assert.deepEqual(design.assignees, ['bob@example.com']);
    assert.equal(design.date_started, '2026-10-01T00:00:00.000Z');
    assert.equal(design.date_due, '2026-10-10T00:00:00.000Z');
    assert.deepEqual(design.tags, ['design', 'web']);
    assert.deepEqual(design.custom_fields, { Priority: 'High', [ESTIMATE_FIELD]: 1.25 });
    assert.equal(design.parent_ref, undefined);
    assert.equal(colours.title, 'Pick colours', 'the prefix is not part of the title');
    assert.equal(colours.parent_ref, design.ref, '"-" is a subtask of the task above');
    assert.equal(colours.column_name, 'Website', 'a subtask is in its parent\'s task list');
    assert.deepEqual(colours.custom_fields, { Priority: 'Low', [ESTIMATE_FIELD]: 0.42, Complete: true });
    assert.equal(colours.due_complete, undefined, 'no due date to mark done');
    assert.equal(client.parent_ref, colours.ref, '"--" is one level deeper');
    assert.deepEqual(client.custom_fields, { [ESTIMATE_FIELD]: 1.5 });
    assert.equal(wireframe.parent_ref, design.ref, '"#" closes the deeper level');
    assert.equal(copy.parent_ref, undefined);
    assert.equal(copy.date_due, '2026-10-12T00:00:00.000Z');
    assert.equal(copy.due_complete, true, 'Complete marks the due date done');
    assert.deepEqual(copy.custom_fields, { [ESTIMATE_FIELD]: 2, Complete: true });
    assert.equal(plan.column_name, 'Launch');
    assert.equal(announce.title, 'Announce');
    assert.equal(announce.parent_ref, plan.ref, '">" is a subtask too');
    assert.equal(celebrate.column_name, 'Launch', 'an empty Tasklist continues the list above');
    assert.equal(celebrate.parent_ref, undefined);
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }, { index: 2, parent: 1 }, { index: 3, parent: 0 }, { index: 6, parent: 5 }]);
    assert.deepEqual(planImportedCustomFields(board.tasks).fields.find(f => f.name === 'Complete'), { name: 'Complete', type: 'checkbox' });
    assert.deepEqual(board.unsupported, []);
  });

  await test('estimated time reads every documented form, and only those', async () => {
    assert.equal(teamworkEstimateMinutes('25'), 25);
    assert.equal(teamworkEstimateMinutes('01:30'), 90);
    assert.equal(teamworkEstimateMinutes('1h 15m'), 75);
    assert.equal(teamworkEstimateMinutes('1h'), 60);
    assert.equal(teamworkEstimateMinutes('2 hours'), 120);
    assert.equal(teamworkEstimateMinutes(45), 45);
    assert.equal(teamworkEstimateMinutes(new Date(Date.UTC(1899, 11, 30, 1, 30))), 90, 'Excel made 01:30 a time');
    assert.equal(teamworkEstimateMinutes('soon'), undefined);
    assert.equal(teamworkEstimateMinutes('1:75'), undefined);
    assert.equal(teamworkEstimateMinutes(new Date(Date.UTC(2026, 0, 1))), undefined);
    assert.equal(teamworkEstimateText(75), '01:15');
    assert.equal(teamworkEstimateText(0), '');
  });

  await test('negative: unknown values, bad dates, a skipped level, other columns and a non-template workbook', async () => {
    const board = parseTeamworkSheet({ name: 'Sheet1', rows: [
      ['Project export'],
      [...HEADER, 'Milestone'],
      ['Ops', '>Orphan', '', '', '', '', '', '', '', ''],
      ['Ops', 'Patch servers', '', '', '31/02/2026', 'next week', 'urgent', 'a while', '', 'Done', 'M1'],
      ['Other', '---Too deep', '', '', '', '', '', '', '', ''],
      ['Ops', '-', '', '', '', '', '', '', '', ''],
    ] });
    assert.equal(board.board.name, 'Imported Teamwork.com tasks', 'a generic sheet name is not a board name');
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/row\/2 columns that are not in Teamwork\.com's import template are not imported: Milestone/);
    assert.match(reasons, /\/row\/4\/Start date Teamwork\.com date "31\/02\/2026" is not a calendar date/);
    assert.match(reasons, /\/row\/4\/Due date Teamwork\.com date "next week"/);
    assert.match(reasons, /\/row\/4\/Priority Teamwork\.com priority "urgent" is not low, medium or high/);
    assert.match(reasons, /\/row\/4\/Estimated time Teamwork\.com estimated time "a while"/);
    assert.match(reasons, /\/row\/4\/Status Teamwork\.com status "Done" is not Active or Complete/);
    assert.match(reasons, /\/row\/5\/Task a subtask 3 levels deep under a task 0 levels deep is imported one level below it/);
    assert.match(reasons, /\/row\/5\/Tasklist a subtask stays in its parent's task list "Ops", not "Other"/);
    assert.match(reasons, /\/row\/6 a Teamwork\.com row without a task name is not imported/);
    assert.match(reasons, /\/row\/3\/Task a subtask without a task above it is imported as a task/);
    const [orphan, patch, deep] = board.tasks;
    assert.equal(board.tasks.length, 3);
    assert.equal(orphan.title, 'Orphan');
    assert.equal(orphan.parent_ref, undefined);
    assert.equal(patch.custom_fields, undefined);
    assert.equal(patch.date_due, undefined);
    assert.equal(deep.parent_ref, patch.ref);
    assert.equal(deep.column_name, 'Ops');
    assert.throws(() => parseTeamworkSheet({ name: 'x', rows: [] }), /empty/);
    assert.throws(() => parseTeamworkSheet({ name: 'x', rows: [['Name', 'Status'], ['a', 'b']] }), /Tasklist and Task columns/);
    await assert.rejects(readTeamworkWorkbook(''), /empty/);
    await assert.rejects(readTeamworkWorkbook(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).toString('base64')), /\.xls file; save it as \.xlsx/);
    assert.throws(() => validateImportSourceShape('teamwork', 'text'), /Invalid teamwork/);
    assert.doesNotThrow(() => validateImportSourceShape('teamwork', { excelBase64: 'UEsDBA==' }));
  });

  await test('day/month order is decided for the whole file', async () => {
    const board = parseTeamworkSheet({ name: 'x', rows: [HEADER,
      ['A', 'One', '', '', '02/10/2026', '25/10/2026', '', '', '', ''],
    ] });
    assert.equal(board.tasks[0].date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(board.tasks[0].date_due, '2026-10-25T00:00:00.000Z');
    const ambiguous = parseTeamworkSheet({ name: 'x', rows: [HEADER, ['A', 'One', '', '', '', '02/10/2026', '', '', '', '']] });
    assert.ok(ambiguous.unsupported.some(u => u.path === '/dates'));
  });

  await test('export writes the template, and it imports back', async () => {
    const built = formatters.teamwork({
      board: { title: 'Launch: phase/1' },
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'To do', owner: 'alice', assignees: ['bob'], labels: ['urgent', 'a,b'],
          dueAt: '2026-10-20T00:00:00.000Z', startAt: '2026-10-01T00:00:00.000Z', description: 'Two of them',
          customFields: { Priority: 'High', [ESTIMATE_FIELD]: 1.25, Vendor: 'ACME' } },
        { cardId: 'c2', title: 'Check stock', listTitle: 'To do', parentCardId: 'c1', dueAt: '2026-10-05T00:00:00.000Z', dueComplete: true },
        { cardId: 'c3', title: 'Count shelves', listTitle: 'To do', parentCardId: 'c2', customFields: { Complete: true } },
        { cardId: 'c4', title: 'Elsewhere', listTitle: 'Done', parentCardId: 'c1', endAt: '2026-10-06T00:00:00.000Z' },
        { cardId: 'c5', title: '#1 priority', listTitle: 'Done' },
      ],
    });
    assert.deepEqual(built.rows[0], TEAMWORK_COLUMNS);
    assert.deepEqual(built.rows.slice(1).map(row => row[1]), ['Order valves', '-Check stock', '--Count shelves', 'Elsewhere', '1 priority']);
    assert.deepEqual(built.rows[1].slice(6), ['high', '01:15', 'urgent, a b', 'Active']);
    const back = parseTeamworkSheet(await readTeamworkWorkbook((await writeTeamworkWorkbook(built)).toString('base64')));
    assert.equal(back.board.name, 'Launch  phase 1');
    assert.deepEqual(back.unsupported, []);
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    const [order, check, count, elsewhere] = back.tasks;
    assert.equal(order.owner_username, 'alice');
    assert.deepEqual(order.assignees, ['bob']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(order.date_started, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(order.tags, ['urgent', 'a b']);
    assert.equal(order.description, 'Two of them');
    assert.deepEqual(order.custom_fields, { Priority: 'High', [ESTIMATE_FIELD]: 1.25 });
    assert.equal(check.parent_ref, order.ref);
    assert.equal(check.due_complete, true);
    assert.equal(count.parent_ref, check.ref);
    assert.deepEqual(count.custom_fields, { Complete: true });
    assert.equal(elsewhere.parent_ref, undefined, 'a subtask in another list is exported as a task of its own list');
    assert.equal(elsewhere.column_name, 'Done');
    assert.deepEqual(elsewhere.custom_fields, { Complete: true });
  });

  await test('wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.teamwork, parseTeamworkSheet);
    assert.equal(formatters.teamwork, formatTeamworkSheet);
    assert.match(read('models/import.js'), /case 'teamwork':[\s\S]*?check\(board, Object\);[\s\S]*?readTeamworkWorkbook\(importedBoard\.excelBase64\);\s*importedBoard = EXTERNAL_PARSERS\.teamwork\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'teamwork', this\);\s*creator = new KanboardCreator\(data, 'teamwork'\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /teamwork: \(\) => require\('\/server\/lib\/teamworkWorkbook'\)\.writeTeamworkWorkbook,/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'teamwork', name: 'Teamwork\.com'[,}]/); // the one list of sources
    // The workbook sources share one branch; their order there is not the point.
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'teamwork', name: '[^']+', \.\.\.EXCEL/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'teamwork'[^}]*path: 'export\/teamwork', ext: 'xlsx'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Teamwork/Teamwork.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Teamwork\/Teamwork\.md\)/);
  });

  console.log(`\nteamworkFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
