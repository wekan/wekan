'use strict';

// Tasks.org backup JSON import/export (models/lib/tasksorgFormat.js).
// The sample follows Tasks.org's writer (org.tasks.backup.TasksJsonExporter):
// properties equal to their default are left out, dates are epoch ms, a due
// date has a time only when ms % 60000 > 0, a task's list is its
// caldavTasks[].calendar and a subtask names its parent in remoteParent.
// Run: node tests/tasksorgFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

// 2026-10-20 08:30 UTC with Tasks.org's "has a time" second.
const TIMED = Date.UTC(2026, 9, 20, 8, 30) + 1000;
// An all-day due date: local noon, seconds 0 (here a UTC+2 device).
const ALL_DAY = Date.UTC(2026, 9, 21, 10, 0);

const SAMPLE = {
  version: 140100,
  timestamp: 1791100000000,
  data: {
    tasks: [
      {
        task: { title: 'Write report', priority: 0, dueDate: TIMED, hideUntil: ALL_DAY - 86400000,
          creationDate: 1791100000000, modificationDate: 1791100000000, notes: 'Q3 numbers',
          elapsedSeconds: 5400, estimatedSeconds: 7200, remoteId: 'task-1' },
        tags: [{ name: 'work', tagUid: 'tag-1' }],
        comments: [{ remoteId: 'c1', message: 'Started', created: 1791100500000 }],
        caldavTasks: [{ calendar: 'list-1', remoteId: 'task-1', object: 'task-1.ics' }],
      },
      {
        task: { title: 'Collect data', completionDate: 1791150000000, dueDate: ALL_DAY,
          creationDate: 1791100000001, modificationDate: 1791150000000, remoteId: 'task-2' },
        caldavTasks: [{ calendar: 'list-1', remoteId: 'task-2', object: 'task-2.ics', remoteParent: 'task-1' }],
      },
      {
        task: { title: 'Buy milk', priority: 2, remoteId: 'task-3' },
        caldavTasks: [{ calendar: 'list-2', remoteId: 'task-3', object: 'task-3.ics' }],
      },
    ],
    places: [],
    tags: [{ remoteId: 'tag-1', name: 'work', color: -14575885 }],
    filters: [],
    caldavAccounts: [{ uuid: 'acct-local', name: 'My lists', accountType: 2 }],
    caldavCalendars: [
      { account: 'acct-local', uuid: 'list-2', name: 'Shopping', order: 1 },
      { account: 'acct-local', uuid: 'list-1', name: 'Work', order: 0 },
      { account: 'acct-local', uuid: 'list-empty', name: 'Someday' },
    ],
    taskListMetadata: [], taskAttachments: [],
    intPrefs: {}, longPrefs: {}, stringPrefs: {}, boolPrefs: {}, setPrefs: {},
  },
};

async function main() {
  const { parseTasksOrgBackup, formatTasksOrgBackup, tasksorgDate, tasksorgMillis, TASKSORG_BACKUP_VERSION } =
    await import('../models/lib/tasksorgFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a backup maps to lists, cards, notes, tags, priority, dates, comments and subtasks', () => {
    const board = parseTasksOrgBackup(SAMPLE);
    assert.equal(board.board.name, 'My lists', 'the one account names the board');
    assert.deepEqual(board.columns.map(c => c.title), ['Work', 'Shopping', 'Someday'], 'Tasks.org list order, empty lists kept');
    const [report, data, milk] = board.tasks;
    assert.equal(report.title, 'Write report');
    assert.equal(report.description, 'Q3 numbers');
    assert.equal(report.column_name, 'Work');
    assert.deepEqual(report.tags, ['work']);
    assert.deepEqual(report.custom_fields, { Priority: 'High', 'Estimate (hours)': 2 });
    assert.equal(report.spent_hours, 1.5);
    assert.equal(report.date_due, '2026-10-20T08:30:00.000Z', 'the "has a time" second is dropped');
    assert.equal(report.date_started, '2026-10-20T12:00:00.000Z', 'an all-day start is that day');
    assert.equal(report.date_creation, new Date(1791100000000).toISOString());
    assert.deepEqual(report.comments, [{ text: 'Started', date: new Date(1791100500000).toISOString() }]);
    assert.equal(report.ref, 'task-1');
    assert.equal(data.parent_ref, 'task-1');
    assert.equal(data.date_end, new Date(1791150000000).toISOString(), 'completion is the end date');
    assert.equal(data.date_due, '2026-10-21T12:00:00.000Z', 'all-day: the day, at noon UTC');
    assert.equal(data.custom_fields, undefined, 'priority 3 (the omitted default) is no priority');
    assert.deepEqual(milk.custom_fields, { Priority: 'Low' });
    assert.equal(milk.column_name, 'Shopping');
    assert.deepEqual(board.unsupported, []);
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.parents, [{ index: 1, parent: 0 }], 'the subtask becomes a card linked to its parent');
    const plan = planImportedTask(data);
    assert.equal(plan.card.endAt.toISOString(), data.date_end);
    assert.equal(plan.card.archived, false, 'a completed task stays in its list');
    assert.deepEqual(planImportedCustomFields(board.tasks).fields,
      [{ name: 'Priority', type: 'text' }, { name: 'Estimate (hours)', type: 'number' }]);
    assert.equal(EXTERNAL_PARSERS.tasksorg(JSON.stringify(SAMPLE)).tasks.length, 3, 'text is read too');
  });

  test('negative: deleted tasks, repeats, reminders and the rest are reported, never guessed', () => {
    const board = parseTasksOrgBackup({ version: 1, data: { tasks: [
      { task: { title: 'Gone', deletionDate: 1791100000000 } },
      { task: { title: 'Weekly', recurrence: 'FREQ=WEEKLY', priority: 7, timerStart: 1791100000000 },
        alarms: [{ time: 0, type: 1 }], geofences: [{ place: 'p' }], attachments: [{ attachmentUid: 'a' }],
        comments: [{ message: '', picture: 'content://x' }],
        caldavTasks: [{ calendar: 'missing', remoteId: 'w' }] },
      'not a task',
      { task: { title: 'Orphan' }, caldavTasks: [{ calendar: 'missing', remoteId: 'o', remoteParent: 'nobody' }] },
    ] } });
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/data\/tasks\/0\/task\/deletionDate Tasks\.org task "Gone" is deleted/);
    assert.match(reasons, /\/data\/tasks\/1\/task\/recurrence Tasks\.org repeat rule "FREQ=WEEKLY"/);
    assert.match(reasons, /\/data\/tasks\/1\/task\/priority Tasks\.org priority 7/);
    assert.match(reasons, /\/data\/tasks\/1\/alarms 1 Tasks\.org reminder/);
    assert.match(reasons, /\/data\/tasks\/1\/geofences 1 Tasks\.org location reminder/);
    assert.match(reasons, /\/data\/tasks\/1\/attachments 1 Tasks\.org attachment/);
    assert.match(reasons, /\/data\/tasks\/1\/task\/timerStart the running Tasks\.org timer/);
    assert.match(reasons, /\/data\/tasks\/1\/comments\/0\/picture/);
    assert.match(reasons, /\/data\/tasks\/1\/caldavTasks\/0\/calendar Tasks\.org list "missing"/);
    assert.match(reasons, /\/data\/tasks\/2 a Tasks\.org backup entry without a task/);
    assert.deepEqual(board.tasks.map(t => t.title), ['Weekly', 'Orphan'], 'the deleted task is skipped');
    assert.deepEqual(board.columns.map(c => c.title), ['No list']);
    assert.equal(board.board.name, 'Imported Tasks.org');
    assert.deepEqual(planImportedLinks(board.tasks).unsupported.map(u => u.reason), ['parent is not part of this import']);
    assert.equal(tasksorgDate(0), undefined, '0 is no date');
    assert.equal(tasksorgDate(-5), undefined);
    assert.throws(() => parseTasksOrgBackup('{'), /not JSON/);
    assert.throws(() => parseTasksOrgBackup({ tasks: [] }), /needs data\.tasks/);
    assert.throws(() => parseTasksOrgBackup([]), /needs data\.tasks/);
    assert.throws(() => validateImportSourceShape('tasksorg', { data: {} }), /Invalid tasksorg/);
    assert.throws(() => validateImportSourceShape('tasksorg', 'text'), /Invalid tasksorg/);
    validateImportSourceShape('tasksorg', SAMPLE);
  });

  test('export writes a backup Tasks.org\'s importer accepts, and it imports back', () => {
    const now = new Date('2026-10-08T10:00:00.000Z');
    const doc = formatters.tasksorg({
      board: { _id: 'b1', title: 'Launch' },
      lists: [{ _id: 'l1', title: 'To do' }, { _id: 'l2', title: 'Done' }, { _id: 'l3', title: 'Empty' }],
      items: [
        { cardId: 'c1', listId: 'l1', listTitle: 'To do', title: 'Order valves', description: 'Two "big" ones',
          dueAt: '2026-10-20T08:30:00.000Z', startAt: '2026-10-19T00:00:00.000Z', createdAt: '2026-10-01T09:00:00.000Z',
          labels: ['Purchasing', 'Purchasing'], customFields: { Priority: 'Medium', 'Estimate (hours)': 1.5 },
          comments: [{ text: 'Asked', author: 'ann', date: '2026-10-02T09:00:00.000Z' }],
          checklists: [{ title: 'Steps', items: [{ title: 'Ask', done: true }, { title: 'Pay', done: false }] }] },
        { cardId: 'c2', listId: 'l1', listTitle: 'To do', title: 'Sub', parentCardId: 'c1' },
        { cardId: 'c3', listId: 'l2', listTitle: 'Done', title: 'Shipped', parentCardId: 'c1', endAt: '2026-10-07T00:00:00.000Z' },
      ],
    }, now);
    assert.equal(doc.version, TASKSORG_BACKUP_VERSION);
    assert.equal(doc.timestamp, now.getTime());
    // What TasksJsonImporter dereferences with !! or needs without a default.
    for (const account of doc.data.caldavAccounts) assert.ok(account.uuid && account.accountType === 2);
    for (const calendar of doc.data.caldavCalendars) assert.ok(calendar.uuid && calendar.account === doc.data.caldavAccounts[0].uuid);
    for (const tag of doc.data.tags) assert.ok(tag.remoteId && tag.name);
    for (const backup of doc.data.tasks) {
      assert.ok(backup.task && backup.task.remoteId, 'every entry has its task');
      assert.ok(backup.caldavTasks.length === 1 && backup.caldavTasks[0].calendar, 'and the list it is in');
      for (const tag of backup.tags || []) assert.ok(doc.data.tags.some(t => t.remoteId === tag.tagUid && t.name === tag.name));
    }
    for (const key of ['places', 'filters', 'taskListMetadata', 'taskAttachments']) assert.deepEqual(doc.data[key], []);
    const [valves] = doc.data.tasks;
    assert.equal(valves.task.dueDate % 60000, 1000, 'a timed due date carries Tasks.org\'s second');
    assert.equal(valves.task.hideUntil, Date.UTC(2026, 9, 19, 12), 'a midnight date is all-day');
    assert.equal(valves.task.priority, 1);
    assert.equal(valves.task.estimatedSeconds, 5400);
    assert.equal(valves.tags.length, 1, 'a label is one tag');
    assert.equal(doc.data.tasks.length, 5, 'three cards and two checklist items');
    const back = parseTasksOrgBackup(JSON.parse(JSON.stringify(doc)));
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done', 'Empty']);
    const [card, ask, pay, sub, shipped] = back.tasks;
    assert.equal(card.title, 'Order valves');
    assert.equal(card.description, 'Two "big" ones');
    assert.equal(card.date_due, '2026-10-20T08:30:00.000Z');
    assert.equal(card.date_started, '2026-10-19T12:00:00.000Z');
    assert.equal(card.date_creation, '2026-10-01T09:00:00.000Z');
    assert.deepEqual(card.tags, ['Purchasing']);
    assert.deepEqual(card.custom_fields, { Priority: 'Medium', 'Estimate (hours)': 1.5 });
    assert.equal(card.comments[0].text, 'Asked');
    assert.equal(ask.parent_ref, card.ref, 'a checklist item is a subtask of its card');
    assert.equal(ask.date_end, now.toISOString(), 'a finished item is completed');
    assert.equal(pay.date_end, undefined);
    assert.equal(sub.parent_ref, card.ref, 'a subtask card in the same list keeps its parent');
    assert.equal(shipped.parent_ref, undefined, 'Tasks.org links parents within one list only');
    assert.equal(shipped.date_end, '2026-10-07T00:00:00.000Z');
    assert.deepEqual(back.unsupported, []);
    assert.deepEqual(planImportedLinks(back.tasks).unsupported, []);
    // A second export of the same board names the same tasks, so Tasks.org skips them.
    assert.deepEqual(formatTasksOrgBackup({ board: { _id: 'b1' }, lists: [], items: [{ cardId: 'c1', title: 'x' }] }, now).data.tasks[0].task.remoteId,
      valves.task.remoteId);
    assert.equal(tasksorgMillis('2026-10-20T08:30:00.000Z', { allDayAware: true }) - 1000, Date.UTC(2026, 9, 20, 8, 30));
  });

  test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.tasksorg, parseTasksOrgBackup);
    assert.equal(formatters.tasksorg, formatTasksOrgBackup);
    assert.match(read('models/import.js'), /case 'tasksorg':\s*\/\/[^\n]*\n\s*check\(board, Object\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.tasksorg\(importedBoard\);/);
    // JSON: the shared handler sends it, not a text type.
    assert.doesNotMatch(read('models/export.js') + read('server/lib/renderExternalExport.js'), /tasksorg: '/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'tasksorg', name: 'Tasks\.org'[,}]/); // the one list of sources
    assert.doesNotMatch(page, /dataSource === 'tasksorg'/, 'a backup is JSON, parsed by the page like the other JSON sources');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'tasksorg'[^}]*path: 'export\/tasksorg', ext: 'json'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Tasks-org/Tasks-org.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Tasks\-org\/Tasks\-org\.md\)/);
  });

  console.log(`\ntasksorgFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
