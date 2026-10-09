'use strict';

// ClickUp task CSV import/export (models/lib/clickupCsvFormat.js): the
// workspace export columns and the Spreadsheets importer columns of ClickUp's
// help center. Run: node tests/clickupCsv.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  const { parseClickUpCsv, formatClickUpCsv, clickupDate, CLICKUP_COLUMNS, CLICKUP_EXPORT_COLUMNS } = await import('../models/lib/clickupCsvFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { planImportedLinks, planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };
  const csv = (header, rows) => [header.join(','), ...rows.map(values => header.map(name => {
    const value = values[name] === undefined ? '' : String(values[name]);
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }).join(','))].join('\n');

  test('a workspace export maps statuses, lists, space, tasks, subtasks, people, tags, dates, time and fields', () => {
    const board = parseClickUpCsv(csv(CLICKUP_COLUMNS, [
      { 'Task ID': '86a1b2c3d', 'Task Link': 'https://app.clickup.com/t/86a1b2c3d', 'Task Type': 'Task', 'Task Name': 'Design landing page',
        'Task Content': 'Hero + pricing', Status: 'in progress', 'Date created': '1767184200000',
        'Date created Text': 'Wednesday, December 31st 2025, 12:30:00 pm +00:00', 'Due date': '1767787200000', 'Subtask IDs': '[86a1b2c3e]',
        Attachments: '[{"title":"sunset beach pic.png","url":"https://example.com/s.png"}]', Assignees: '[Jane Doe,John Smith]', Tags: '[web,q1]',
        Priority: 'high', 'List Name': 'Website', 'Folder Name/Path': 'Marketing', 'Space Name': 'Team', 'Time Estimated': '3600000', 'Time Spent': '5400000' },
      { 'Task ID': '86a1b2c3e', 'Task Type': 'Milestone', 'Task Name': 'Hero image', Status: 'to do', 'List Name': 'Website', Comments: '[{"text":"hi"}]' },
    ]));
    assert.equal(board.board.name, 'Team');
    assert.deepEqual(board.columns.map(c => c.title), ['in progress', 'to do']);
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Website']);
    const [page, hero] = board.tasks;
    assert.equal(page.ref, '86a1b2c3d');
    assert.equal(page.description, 'Hero + pricing\n\n[sunset beach pic.png](https://example.com/s.png)');
    assert.equal(page.owner_username, 'Jane Doe');
    assert.deepEqual(page.assignees, ['John Smith']);
    assert.deepEqual(page.tags, ['web', 'q1']);
    assert.equal(page.date_creation, '2025-12-31T12:30:00.000Z', 'Unix milliseconds win over the text column');
    assert.equal(page.date_due, '2026-01-07T12:00:00.000Z');
    assert.equal(page.spent_hours, 1.5);
    assert.deepEqual(page.custom_fields, { Priority: 'High', Folder: 'Marketing', 'Time Estimate (hours)': 1 });
    assert.equal(hero.parent_ref, '86a1b2c3d', 'Subtask IDs of the parent make the link');
    assert.deepEqual(hero.custom_fields, { 'Task Type': 'Milestone' });
    assert.deepEqual(planImportedLinks(board.tasks).parents, [{ index: 1, parent: 0 }]);
    assert.equal(planImportedTask(page).card.spentTime, 1.5);
    assert.ok(board.unsupported.some(u => u.path === '/row/3/Comments'), 'comments have no documented format');
  });

  test('the Spreadsheets importer shape, from ClickUp\'s own example', () => {
    const board = parseClickUpCsv([
      'Task ID,Task Name,Status,Priority,Subtask IDs,Checklist,Description content,Task assignee,Due date',
      '1,Launch marketing campaign,Concept,Normal,"2,3",,,a@example.com,2026-10-10',
      '2,Design landing page,Open,High,"4,5","Wireframe,Copy",Pages,,',
      '3,Set up analytics,Concept,2,,,,,',
    ].join('\n'));
    assert.deepEqual(board.columns.map(c => c.title), ['Concept', 'Open']);
    const [launch, design, analytics] = board.tasks;
    assert.equal(launch.owner_username, 'a@example.com');
    assert.equal(launch.date_due, '2026-10-10T00:00:00.000Z');
    assert.equal(design.parent_ref, '1');
    assert.equal(design.description, 'Pages');
    assert.deepEqual(design.checklists[0].items.map(i => i.title), ['Wireframe', 'Copy']);
    assert.equal(analytics.parent_ref, '1');
    assert.deepEqual(analytics.custom_fields, { Priority: 'High' }, 'importer priority 2 is High');
    assert.ok(board.unsupported.every(u => !/Subtask/.test(u.reason)), 'children 4 and 5 that are not rows are not errors here');
  });

  test('negative: unknown priorities and dates and malformed attachments are reported', () => {
    const board = parseClickUpCsv([
      'Task Name,Priority,Due date,Attachments',
      'A,critical,"Wednesday, December 31st 2025",not json',
      ',low,,',
    ].join('\n'));
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /Priority ClickUp priority "critical"/);
    assert.match(reasons, /Due date ClickUp date "Wednesday, December 31st 2025"/);
    assert.match(reasons, /Attachments ClickUp attachments are not the documented JSON list/);
    assert.match(reasons, /a ClickUp row without a task name/);
    assert.equal(clickupDate('2026-02-30'), undefined);
    assert.throws(() => parseClickUpCsv(''), /empty/);
    assert.throws(() => parseClickUpCsv('Name,Status\nA,B'), /Task Name/);
  });

  test('export writes the workspace columns and the importer\'s Checklist, and it imports back', () => {
    const out = formatters.clickup({
      board: { title: 'Launch' },
      items: [
        { cardId: 'c1', title: 'Order, valves', listTitle: 'to do', swimlaneTitle: 'Website', description: 'Two "big"', owner: 'alice',
          assignees: ['bob'], labels: ['web', 'a,b'], createdAt: '2026-10-01T08:00:00.000Z', dueAt: '2026-10-20T00:00:00.000Z',
          customFields: { Priority: 'Urgent', 'Time Estimate (hours)': 2, Folder: 'Marketing' },
          checklists: [{ title: 'C', items: [{ title: 'Quote', done: true }, { title: 'Order', done: false }] }] },
        { cardId: 'c2', title: 'Child', listTitle: 'complete', swimlaneTitle: 'Default', parentCardId: 'c1' },
      ],
    });
    assert.equal(out.split('\r\n')[0], CLICKUP_EXPORT_COLUMNS.join(','));
    const back = parseClickUpCsv(out);
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Website', 'Default']);
    const [order, child] = back.tasks;
    assert.equal(order.title, 'Order, valves');
    assert.equal(order.description, 'Two "big"');
    assert.equal(order.owner_username, 'alice');
    assert.deepEqual(order.assignees, ['bob']);
    assert.deepEqual(order.tags, ['web', 'a b']);
    assert.equal(order.date_due, '2026-10-20T00:00:00.000Z');
    assert.deepEqual(order.custom_fields, { Priority: 'Urgent', Folder: 'Marketing', 'Time Estimate (hours)': 2 });
    assert.deepEqual(order.checklists[0].items.map(i => i.title), ['Quote', 'Order']);
    assert.equal(child.parent_ref, 'c1');
    assert.deepEqual(back.unsupported, []);
  });

  test('wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.clickup, parseClickUpCsv);
    assert.equal(formatters.clickup, formatClickUpCsv);
    assert.match(read('models/import.js'), /case 'clickup':\s*\/\/[^\n]*\n\s*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.clickup\(importedBoard\);/);
    assert.match(read('server/lib/renderExternalExport.js'), /clickup: 'text\/csv'/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'clickup', name: 'ClickUp'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'clickup', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'clickup'[^}]*path: 'export\/clickup', ext: 'csv'/);
    assert.match(JSON.parse(read('imports/i18n/data/en.i18n.json'))['import-board-instruction-clickup'], /Export Items/);
  });

  console.log(`\nclickupCsv: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
