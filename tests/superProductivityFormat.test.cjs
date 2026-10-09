'use strict';

// Super Productivity backup import/export (models/lib/superProductivityFormat.js).
// The sample follows the shape of Super Productivity's own e2e fixtures
// (e2e/fixtures/test-backup-with-archives.json): the
// { timestamp, lastUpdate, crossModelVersion, data } wrapper, NgRx entity
// states, an archive, sub-tasks, tags and a backlog.
// Run: node tests/superProductivityFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const ADVANCED = { worklogExportSettings: { cols: ['DATE'], roundWorkTimeTo: null, roundStartTimeTo: null, roundEndTimeTo: null, groupBy: 'DATE', separateTasksBy: '' } };
const task = (id, fields) => ({ id, subTaskIds: [], timeSpentOnDay: {}, timeSpent: 0, timeEstimate: 0, isDone: false, notes: '', tagIds: [], created: 1733000000000, attachments: [], projectId: 'INBOX_PROJECT', ...fields });
const SAMPLE = {
  timestamp: 1733100000000,
  lastUpdate: 1733100000000,
  crossModelVersion: 4.5,
  data: {
    project: {
      ids: ['INBOX_PROJECT', 'work'],
      entities: {
        INBOX_PROJECT: { id: 'INBOX_PROJECT', title: 'Inbox', isHiddenFromMenu: false, taskIds: ['t1', 't2'], backlogTaskIds: [], noteIds: [], theme: { primary: '#607d8b' }, icon: 'inbox', isArchived: false, advancedCfg: ADVANCED },
        work: { id: 'work', title: 'Work', taskIds: ['w1'], backlogTaskIds: ['w2'], noteIds: ['n1'], theme: {}, advancedCfg: ADVANCED, isEnableBacklog: true },
      },
    },
    tag: {
      ids: ['TODAY', 'KANBAN_IN_PROGRESS', 'urgent'],
      entities: {
        TODAY: { id: 'TODAY', title: 'Today', taskIds: [], created: 1, theme: {}, advancedCfg: ADVANCED },
        KANBAN_IN_PROGRESS: { id: 'KANBAN_IN_PROGRESS', title: 'in-progress', taskIds: ['t2'], created: 1, theme: {}, advancedCfg: ADVANCED },
        urgent: { id: 'urgent', title: 'urgent', taskIds: ['t1'], created: 1, theme: {}, advancedCfg: ADVANCED },
      },
    },
    task: {
      ids: ['t1', 't1a', 't2', 'w1', 'w2'],
      entities: {
        t1: task('t1', { title: 'Write report', subTaskIds: ['t1a'], timeEstimate: 5400000, timeSpent: 1800000, timeSpentOnDay: { '2024-12-01': 1800000 }, notes: 'Q3 numbers', tagIds: ['urgent', 'TODAY'], dueDay: '2024-12-05', priority: 3,
          attachments: [{ id: 'a1', type: 'LINK', title: 'Spec', path: 'https://example.com/spec', icon: 'bookmark' }, { id: 'a2', type: 'FILE', title: 'local', path: '/home/me/x.pdf', icon: 'insert_drive_file' }] }),
        t1a: task('t1a', { title: 'Collect data', parentId: 't1', isDone: true, doneOn: 1733050000000 }),
        t2: task('t2', { title: 'Review', tagIds: ['KANBAN_IN_PROGRESS'], dueWithTime: 1733150000000, deadlineDay: '2024-12-09', repeatCfgId: 'r1', priority: 'low' }),
        w1: task('w1', { title: 'Deploy', projectId: 'work', issueId: '42', issueType: 'GITHUB' }),
        w2: task('w2', { title: 'Someday', projectId: 'work' }),
      },
      currentTaskId: null, selectedTaskId: null, lastCurrentTaskId: null, isDataLoaded: false,
    },
    note: { ids: ['n1'], entities: { n1: { id: 'n1', projectId: 'work', content: 'x' } }, todayOrder: [] },
    boards: { boardCfgs: [{ id: 'KANBAN_DEFAULT', title: 'Kanban', cols: 3, panels: [] }] },
    taskRepeatCfg: { ids: ['r1'], entities: { r1: { id: 'r1' } } },
    archiveYoung: {
      task: { ids: ['old1'], entities: { old1: task('old1', { title: 'Shipped', isDone: true, doneOn: 1732665600000, projectId: 'work' }) } },
      timeTracking: { project: {}, tag: {} }, lastTimeTrackingFlush: 0,
    },
    archiveOld: { task: { ids: [], entities: {} }, timeTracking: { project: {}, tag: {} }, lastTimeTrackingFlush: 0 },
  },
};

// What Super Productivity's import checks of the slices a WeKan export
// carries: the required Task / Project / Tag fields (task.model.ts,
// project.model.ts, tag.model.ts, typia) and the cross-model rules of
// op-log/validation/is-related-model-data-valid.ts.
function assertSuperProductivityAccepts(backup) {
  assert.ok(backup.crossModelVersion === 4.5 && Number.isFinite(backup.timestamp) && backup.data, 'wrapper');
  const d = backup.data;
  for (const key of ['project', 'task', 'tag']) {
    assert.ok(Array.isArray(d[key].ids) && d[key].entities && typeof d[key].entities === 'object', `${key} is an entity state`);
    assert.deepEqual(Object.keys(d[key].entities).sort(), [...d[key].ids].sort(), `${key} ids match its entities`);
  }
  assert.deepEqual(d.note, { ids: [], entities: {}, todayOrder: [] });
  for (const archive of [d.archiveYoung, d.archiveOld]) {
    assert.deepEqual(archive, { task: { ids: [], entities: {} }, timeTracking: { project: {}, tag: {} }, lastTimeTrackingFlush: 0 });
  }
  for (const [key, value] of Object.entries({ currentTaskId: null, selectedTaskId: null, lastCurrentTaskId: null, isDataLoaded: false })) {
    assert.equal(d.task[key], value);
  }
  const context = entity => {
    assert.equal(typeof entity.id, 'string');
    assert.equal(typeof entity.title, 'string');
    assert.ok(Array.isArray(entity.taskIds));
    assert.ok(entity.theme && typeof entity.theme === 'object');
    assert.ok(entity.advancedCfg && entity.advancedCfg.worklogExportSettings, 'advancedCfg.worklogExportSettings is required');
  };
  Object.values(d.project.entities).forEach(project => {
    context(project);
    assert.ok(Array.isArray(project.backlogTaskIds) && Array.isArray(project.noteIds));
    for (const id of [...project.taskIds, ...project.backlogTaskIds]) {
      assert.ok(d.task.entities[id], `project task ${id} exists`);
      assert.equal(d.task.entities[id].projectId, project.id, 'Inconsistent task projectId');
      assert.equal(d.task.entities[id].parentId, undefined, 'a project lists top-level tasks');
    }
  });
  Object.values(d.tag.entities).forEach(tag => {
    context(tag);
    assert.equal(typeof tag.created, 'number');
    tag.taskIds.forEach(id => assert.ok(d.task.entities[id], `tag task ${id} exists`));
  });
  Object.values(d.task.entities).forEach(t => {
    for (const [key, type] of Object.entries({ id: 'string', title: 'string', timeEstimate: 'number', timeSpent: 'number', isDone: 'boolean', projectId: 'string', created: 'number' })) {
      assert.equal(typeof t[key], type, `task.${key}`);
    }
    assert.ok(Array.isArray(t.tagIds) && Array.isArray(t.subTaskIds) && Array.isArray(t.attachments));
    assert.ok(t.timeSpentOnDay && typeof t.timeSpentOnDay === 'object');
    assert.equal(t.timeSpent, Object.values(t.timeSpentOnDay).reduce((a, b) => a + b, 0), 'timeSpent is the sum of timeSpentOnDay');
    assert.ok(d.project.entities[t.projectId], 'projectId from task exists');
    t.tagIds.forEach(id => assert.ok(d.tag.entities[id], 'tagId from task exists'));
    assert.ok(!('parentId' in t) || typeof t.parentId === 'string', 'parentId is a string or absent, never null');
    if (t.parentId) assert.ok(d.task.entities[t.parentId].subTaskIds.includes(t.id));
    t.subTaskIds.forEach(id => assert.equal(d.task.entities[id].parentId, t.id));
    assert.ok(!(t.dueDay && t.dueWithTime), 'dueDay and dueWithTime are exclusive');
    if (t.dueDay) assert.match(t.dueDay, /^\d{4}-\d{2}-\d{2}$/);
    if ('doneOn' in t) assert.equal(typeof t.doneOn, 'number');
    if ('priority' in t) assert.ok([1, 2, 3].includes(t.priority));
  });
  d.boards.boardCfgs.forEach(board => board.panels.forEach(panel => {
    for (const key of ['id', 'title']) assert.equal(typeof panel[key], 'string');
    for (const key of ['taskIds', 'includedTagIds', 'excludedTagIds']) assert.ok(Array.isArray(panel[key]));
    [...panel.includedTagIds, ...panel.excludedTagIds].forEach(id => assert.ok(d.tag.entities[id], `panel tag ${id} exists`));
    assert.ok([1, 2, 3].includes(panel.taskDoneState) && [1, 2, 3].includes(panel.scheduledState));
    assert.equal(typeof panel.isParentTasksOnly, 'boolean');
  }));
}

async function main() {
  const { parseSuperProductivity, formatSuperProductivity, SP_ESTIMATE_FIELD, SP_PRIORITY_FIELD } =
    await import('../models/lib/superProductivityFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  test('a backup maps projects to swimlanes and done state, in-progress tag and backlog to lists', () => {
    const board = parseSuperProductivity(JSON.stringify(SAMPLE));
    assert.equal(board.board.name, 'Super Productivity', 'two projects: the board is not named after one');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Inbox', 'Work']);
    assert.deepEqual(board.columns.map(c => c.title), ['Backlog', 'To Do', 'In Progress', 'Done']);
    const by = Object.fromEntries(board.tasks.map(t => [t.ref, t]));
    assert.equal(by.t1.column_name, 'To Do');
    assert.equal(by.t1a.column_name, 'Done');
    assert.equal(by.t2.column_name, 'In Progress');
    assert.equal(by.w2.column_name, 'Backlog');
    assert.equal(by.old1.column_name, 'Done');
    assert.equal(by.t1.swimlane_name, 'Inbox');
    assert.equal(by.w1.swimlane_name, 'Work');
    assert.deepEqual(by.t1.tags, ['urgent'], 'Today and in-progress are not labels');
    assert.deepEqual(by.t2.tags, []);
  });

  test('notes, links, dates, time, priority, sub-tasks and the archive', () => {
    const board = parseSuperProductivity(SAMPLE);
    const by = Object.fromEntries(board.tasks.map(t => [t.ref, t]));
    assert.equal(by.t1.description, 'Q3 numbers\n\n- [Spec](https://example.com/spec)');
    assert.equal(by.t1.date_due, '2024-12-05T00:00:00.000Z');
    assert.equal(by.t1.spent_hours, 0.5);
    assert.deepEqual(by.t1.custom_fields, { [SP_ESTIMATE_FIELD]: 1.5, [SP_PRIORITY_FIELD]: 'High' });
    assert.equal(by.t1.date_creation, new Date(1733000000000).toISOString());
    assert.equal(by.t2.date_due, '2024-12-09T00:00:00.000Z', 'the deadline is the due date');
    assert.equal(by.t2.date_started, new Date(1733150000000).toISOString(), 'the scheduled time is then the start');
    assert.equal(by.t2.custom_fields[SP_PRIORITY_FIELD], 'Low', 'the legacy string priority');
    assert.equal(by.t1a.parent_ref, 't1');
    assert.equal(by.t1a.date_end, new Date(1733050000000).toISOString());
    assert.equal(by.old1.archived, true);
    assert.equal(planImportedTask(by.old1).card.archived, true);
    assert.equal(planImportedTask(by.t1).card.spentTime, 0.5);
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.unsupported, []);
    assert.equal(links.parents.length, 1);
    assert.deepEqual(planImportedCustomFields(board.tasks).fields, [
      { name: SP_ESTIMATE_FIELD, type: 'number' }, { name: SP_PRIORITY_FIELD, type: 'text' }]);
  });

  test('what has no place on a card is reported', () => {
    const reasons = parseSuperProductivity(SAMPLE).unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    assert.match(reasons, /\/data\/task\/t1\/attachments\/1 a FILE attachment/);
    assert.match(reasons, /\/data\/task\/t2\/repeatCfgId /);
    assert.match(reasons, /\/data\/task\/w1\/issueId the link to GITHUB issue 42/);
    assert.match(reasons, /\/data\/task\/timeSpentOnDay /);
    assert.match(reasons, /\/data\/note 1 Super Productivity note/);
    assert.match(reasons, /\/data\/boards Super Productivity boards are saved filters/);
  });

  test('one project names the board; the bare data object is read too', () => {
    const data = JSON.parse(JSON.stringify(SAMPLE.data));
    data.project = { ids: ['INBOX_PROJECT'], entities: { INBOX_PROJECT: data.project.entities.INBOX_PROJECT } };
    data.task.ids = ['t1', 't1a', 't2'];
    for (const id of ['w1', 'w2']) delete data.task.entities[id];
    data.archiveYoung.task = { ids: [], entities: {} };
    const board = parseSuperProductivity(JSON.stringify(data));
    assert.equal(board.board.name, 'Inbox');
    assert.deepEqual(board.columns.map(c => c.title), ['To Do', 'In Progress', 'Done']);
  });

  test('negative: not JSON, wrong shapes, legacy backups and prototype keys', () => {
    assert.throws(() => parseSuperProductivity('{'), /not valid JSON/);
    assert.throws(() => parseSuperProductivity('[]'), /must be a JSON object/);
    assert.throws(() => parseSuperProductivity('{"crossModelVersion":4.5,"timestamp":1,"data":null}'), /no data object/);
    assert.throws(() => parseSuperProductivity('{"task":{"ids":[],"entities":{}}}'), /task and project models/);
    assert.throws(() => parseSuperProductivity('{"taskArchive":{},"task":{},"project":{}}'), /before version 14/);
    assert.throws(() => validateImportSourceShape('superproductivity', '  '), /Invalid superproductivity/);
    const hostile = parseSuperProductivity('{"project":{"ids":["__proto__"],"entities":{}},"task":{"ids":["__proto__","constructor","x"],'
      + '"entities":{"x":{"id":"x","title":"Kept","tagIds":["nope"],"dueDay":"2024-02-30","created":-5}}}}');
    assert.equal(hostile.tasks.length, 1, 'ids without an own entity are skipped');
    assert.equal(hostile.tasks[0].date_due, undefined, 'an impossible day is refused');
    assert.equal(hostile.tasks[0].date_creation, undefined);
    assert.equal(hostile.tasks[0].swimlane_name, 'No project');
    assert.match(hostile.unsupported.map(u => u.reason).join('\n'), /tag "nope" is not in the backup's tag model/);
    assert.equal({}.polluted, undefined);
  });

  test('export writes a backup Super Productivity accepts, and it imports back', () => {
    const now = Date.UTC(2026, 9, 8, 12);
    const collected = {
      board: { title: 'Launch' },
      lists: [{ title: 'Backlog' }, { title: 'To Do' }, { title: 'In Progress' }, { title: 'Review' }, { title: 'Done' }],
      swimlanes: [{ title: 'Default' }],
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'To Do', swimlaneTitle: 'Default', description: 'Two "big" ones',
          dueAt: '2026-10-20T08:30:00.000Z', labels: ['Purchasing'], createdAt: '2026-10-01T10:00:00.000Z', spentTime: 1.5,
          customFields: { [SP_ESTIMATE_FIELD]: 2, [SP_PRIORITY_FIELD]: 'High' },
          checklists: [{ title: 'Parts', items: [{ title: 'Seal', done: true }, { title: 'Bolt', done: false }] }] },
        { cardId: 'c2', title: 'Pick a supplier', listTitle: 'In Progress', swimlaneTitle: 'Default', parentCardId: 'c1', dueAt: '2026-10-21T00:00:00.000Z' },
        { cardId: 'c3', title: 'Deep sub-task', listTitle: 'Review', swimlaneTitle: 'Default', parentCardId: 'c2', labels: ['Purchasing'] },
        { cardId: 'c4', title: 'Ship it', listTitle: 'Done', swimlaneTitle: 'Default', endAt: '2026-10-07T00:00:00.000Z' },
        { cardId: 'c5', title: 'Later', listTitle: 'Backlog', swimlaneTitle: 'Default' },
      ],
    };
    const json = formatSuperProductivity(collected, { now });
    const backup = JSON.parse(json);
    assertSuperProductivityAccepts(backup);
    assert.equal(backup.timestamp, now);
    const d = backup.data;
    assert.deepEqual(d.project.ids, ['wekan-project-1']);
    const project = d.project.entities['wekan-project-1'];
    assert.equal(project.title, 'Launch');
    assert.deepEqual(project.taskIds, ['c1', 'c4']);
    assert.deepEqual(project.backlogTaskIds, ['c5']);
    assert.equal(project.isEnableBacklog, true);
    const c1 = d.task.entities.c1;
    assert.deepEqual(c1.subTaskIds, ['c2', 'c3'], 'a sub-task of a sub-task hangs under the top-level task');
    assert.equal(c1.dueWithTime, Date.parse('2026-10-20T08:30:00.000Z'));
    assert.equal(c1.timeEstimate, 2 * 3600000);
    assert.equal(c1.timeSpent, 1.5 * 3600000);
    assert.deepEqual(c1.timeSpentOnDay, { '2026-10-01': 1.5 * 3600000 });
    assert.equal(c1.priority, 3);
    assert.match(c1.notes, /^Two "big" ones\n\n### Parts\n- \[x\] Seal\n- \[ \] Bolt$/);
    assert.equal(d.task.entities.c2.dueDay, '2026-10-21');
    assert.deepEqual(d.task.entities.c2.tagIds, ['KANBAN_IN_PROGRESS']);
    assert.equal(d.task.entities.c4.isDone, true);
    assert.equal(d.task.entities.c4.doneOn, Date.parse('2026-10-07T00:00:00.000Z'));
    const reviewTag = d.tag.ids.find(id => d.tag.entities[id].title === 'Review');
    assert.ok(d.task.entities.c3.tagIds.includes(reviewTag), 'a list without a state becomes a tag');
    const panels = d.boards.boardCfgs[0].panels;
    assert.deepEqual(panels.map(p => p.title), ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']);
    assert.deepEqual(panels[3].includedTagIds, [reviewTag]);
    assert.ok(panels[1].excludedTagIds.includes(reviewTag) && panels[1].excludedTagIds.includes('KANBAN_IN_PROGRESS'));
    assert.equal(panels[4].taskDoneState, 2);
    assert.equal(panels[0].backlogState, 3);

    const back = parseSuperProductivity(json);
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Launch']);
    const by = Object.fromEntries(back.tasks.map(t => [t.ref, t]));
    assert.equal(by.c1.title, 'Order valves');
    assert.equal(by.c1.date_due, '2026-10-20T08:30:00.000Z');
    assert.equal(by.c1.spent_hours, 1.5);
    assert.deepEqual(by.c1.custom_fields, { [SP_ESTIMATE_FIELD]: 2, [SP_PRIORITY_FIELD]: 'High' });
    assert.deepEqual(by.c1.tags, ['Purchasing']);
    assert.equal(by.c1.date_creation, '2026-10-01T10:00:00.000Z');
    assert.equal(by.c2.column_name, 'In Progress');
    assert.equal(by.c2.parent_ref, 'c1');
    assert.equal(by.c2.date_due, '2026-10-21T00:00:00.000Z');
    assert.equal(by.c3.parent_ref, 'c1');
    assert.deepEqual(by.c3.tags.sort(), ['Purchasing', 'Review'], 'Review comes back as a label');
    assert.equal(by.c4.column_name, 'Done');
    assert.equal(by.c4.date_end, '2026-10-07T00:00:00.000Z');
    assert.equal(by.c5.column_name, 'Backlog');
    // Only the two notes about Super Productivity's own model come back: the
    // per-day time map the export books the total on, and the board of panels.
    assert.deepEqual(back.unsupported.map(u => u.path), ['/data/task/timeSpentOnDay', '/data/boards']);
  });

  test('several swimlanes become projects; an empty board is still a valid backup', () => {
    const backup = JSON.parse(formatSuperProductivity({
      board: { title: 'Two lanes' }, lists: [{ title: 'Doing' }], swimlanes: [{ title: 'A' }, { title: 'B' }],
      items: [{ cardId: 'x', title: 'X', listTitle: 'Doing', swimlaneTitle: 'B' }, { cardId: 'y', title: 'Y', listTitle: 'Doing', swimlaneTitle: 'A' },
        { cardId: 'z', title: 'Z', listTitle: 'Doing', swimlaneTitle: 'B', parentCardId: 'y' }],
    }));
    assertSuperProductivityAccepts(backup);
    assert.deepEqual(backup.data.project.ids.map(id => backup.data.project.entities[id].title), ['A', 'B']);
    assert.equal(backup.data.task.entities.z.projectId, backup.data.task.entities.y.projectId, 'a sub-task lives in its parent\'s project');
    assert.deepEqual(parseSuperProductivity(JSON.stringify(backup)).swimlanes.map(s => s.name), ['A', 'B']);
    const empty = JSON.parse(formatSuperProductivity({ board: { title: 'Empty' }, lists: [], swimlanes: [], items: [] }));
    assertSuperProductivityAccepts(empty);
    assert.equal(empty.data.project.entities['wekan-project-1'].title, 'Empty');
  });

  test('the format is wired into import, export, the import page and the export menu', () => {
    assert.equal(EXTERNAL_PARSERS.superproductivity, parseSuperProductivity);
    assert.equal(typeof formatters.superproductivity, 'function');
    assertSuperProductivityAccepts(JSON.parse(formatters.superproductivity({ board: { title: 'B' }, lists: [], swimlanes: [], items: [] })));
    assert.match(read('models/import.js'), /case 'superproductivity':\s*(\/\/[^\n]*\n\s*)*check\(board, String\);\s*try \{\s*importedBoard = EXTERNAL_PARSERS\.superproductivity\(importedBoard\);/);
    assert.match(read('models/import.js'), /new KanboardCreator\(data, 'superproductivity'\)/);
    assert.match(read('server/lib/renderExternalExport.js'), /superproductivity: 'application\/json'/);
    assert.match(read('models/lib/externalExporters.js'), /spentTime: Number\(c\.spentTime\)/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'superproductivity', name: 'Super Productivity'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'superproductivity', name: '[^']+', \.\.\.TEXT/, 'read by the one import path');
    assert.match(read('client/components/boards/exportScope.js'), /key: 'superproductivity'[^}]*path: 'export\/superproductivity', ext: 'json'/);
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Super-Productivity/Super-Productivity.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Super\-Productivity\/Super\-Productivity\.md\)/);
  });

  console.log(`\nsuperProductivityFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
