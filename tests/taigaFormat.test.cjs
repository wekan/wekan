'use strict';

// A Taiga project dump: import and export (models/lib/taigaFormat.js). The
// fixture, tests/fixtures/taiga/project-dump.json, is written for this test
// from taiga-back's export serializers (taiga/export_import/serializers/):
// every key they write, in their order, with the value shapes they produce -
// people as emails, statuses, sprints and roles by name, a task's story by
// ref, comments as history entries, attachments as base64.
// Run: node tests/taigaFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const fixture = () => JSON.parse(read('tests/fixtures/taiga/project-dump.json'));

// The keys ProjectExportSerializer writes, in its order, and the fields of
// each content serializer (taiga-back taiga/export_import/serializers/).
const PROJECT_KEYS = ['watchers', 'name', 'slug', 'description', 'created_date', 'logo', 'total_milestones',
  'total_story_points', 'is_epics_activated', 'is_backlog_activated', 'is_kanban_activated', 'is_wiki_activated',
  'is_issues_activated', 'videoconferences', 'videoconferences_extra_data', 'creation_template', 'is_private',
  'is_featured', 'is_looking_for_people', 'looking_for_people_note', 'epics_csv_uuid', 'userstories_csv_uuid',
  'tasks_csv_uuid', 'issues_csv_uuid', 'transfer_token', 'blocked_code', 'totals_updated_datetime', 'total_fans',
  'total_fans_last_week', 'total_fans_last_month', 'total_fans_last_year', 'total_activity',
  'total_activity_last_week', 'total_activity_last_month', 'total_activity_last_year', 'anon_permissions',
  'public_permissions', 'modified_date', 'roles', 'owner', 'memberships', 'points', 'epic_statuses', 'us_statuses',
  'us_duedates', 'task_statuses', 'task_duedates', 'issue_types', 'issue_statuses', 'issue_duedates', 'priorities',
  'severities', 'swimlanes', 'tags_colors', 'default_points', 'default_epic_status', 'default_us_status',
  'default_task_status', 'default_priority', 'default_severity', 'default_issue_status', 'default_issue_type',
  'default_swimlane', 'epiccustomattributes', 'userstorycustomattributes', 'taskcustomattributes',
  'issuecustomattributes', 'epics', 'user_stories', 'tasks', 'milestones', 'issues', 'wiki_links', 'wiki_pages',
  'tags', 'timeline'];
const MIXIN = ['attachments', 'history', 'watchers', 'custom_attributes_values'];
const STORY_KEYS = ['role_points', 'owner', 'assigned_to', 'assigned_users', 'status', 'swimlane', 'milestone',
  'modified_date', 'created_date', 'finish_date', 'generated_from_issue', 'generated_from_task', 'from_task_ref', 'ref',
  'is_closed', 'backlog_order', 'sprint_order', 'kanban_order', 'subject', 'description', 'client_requirement',
  'team_requirement', 'external_reference', 'tribe_gig', 'version', 'blocked_note', 'is_blocked', 'tags', 'due_date',
  'due_date_reason', ...MIXIN];
const TASK_KEYS = ['owner', 'status', 'user_story', 'milestone', 'assigned_to', 'modified_date', 'created_date',
  'finished_date', 'ref', 'subject', 'us_order', 'taskboard_order', 'description', 'is_iocaine', 'external_reference',
  'version', 'blocked_note', 'is_blocked', 'tags', 'due_date', 'due_date_reason', ...MIXIN];
const ISSUE_KEYS = ['owner', 'status', 'assigned_to', 'priority', 'severity', 'type', 'milestone', 'votes',
  'modified_date', 'created_date', 'finished_date', 'ref', 'subject', 'description', 'external_reference', 'version',
  'blocked_note', 'is_blocked', 'tags', 'due_date', 'due_date_reason', ...MIXIN];
const EPIC_KEYS = ['ref', 'owner', 'status', 'epics_order', 'created_date', 'modified_date', 'subject', 'description',
  'color', 'assigned_to', 'client_requirement', 'team_requirement', 'version', 'blocked_note', 'is_blocked', 'tags',
  'related_user_stories', ...MIXIN];
const MILESTONE_KEYS = ['name', 'owner', 'created_date', 'modified_date', 'estimated_start', 'estimated_finish', 'slug',
  'closed', 'disponibility', 'order', 'watchers'];
const TAIGA_DATETIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+0000$/;

// What models/lib/externalExporters.js collects, built from a parsed board,
// so a dump can go out and come back in.
function collectedFrom(parsed) {
  const transfer = parsed.scrumTransfer || { cards: [], sprints: [] };
  const scrumByIndex = new Map(transfer.cards.map(card => [Number(card._id.slice(5)), card.scrum]));
  const labels = [...new Set(parsed.tasks.flatMap(t => t.tags))]
    .map(name => ({ name, color: (parsed.label_colors || {})[name] || 'black' }));
  return {
    board: { _id: 'b1', title: parsed.board.name, labels },
    lists: parsed.columns.map(c => ({ _id: `l-${c.title}`, title: c.title })),
    swimlanes: parsed.swimlanes.map(s => ({ _id: `s-${s.name}`, title: s.name })),
    scrumSprints: transfer.sprints,
    items: parsed.tasks.map((t, index) => ({
      cardId: t.ref || `c${index}`,
      listId: `l-${t.column_name}`,
      title: t.title,
      description: t.description,
      listTitle: t.column_name,
      swimlaneTitle: t.swimlane_name,
      labels: t.tags,
      dueAt: t.date_due,
      createdAt: t.date_creation,
      endAt: t.date_end,
      owner: t.owner_username,
      assignees: t.assignees || [],
      creator: t.requested_by,
      color: t.color,
      ...(t.parent_ref ? { parentCardId: t.parent_ref } : {}),
      ...(t.comments.length ? { comments: t.comments.map(c => ({ text: c.text, author: c.author, date: c.date })) } : {}),
      ...(t.checklists ? { checklists: t.checklists } : {}),
      ...(Object.keys(t.custom_fields).length ? { customFields: t.custom_fields } : {}),
      ...(scrumByIndex.get(index) ? { scrum: scrumByIndex.get(index) } : {}),
    })),
  };
}

async function main() {
  const { parseTaiga, formatTaiga, slimTaigaDump, taigaDate, taigaDateTimeText, wekanLabelColor, MAX_TAIGA_ITEMS } =
    await import('../models/lib/taigaFormat.js');
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters, EXTERNAL_EXPORT_FORMATS } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  const { normalizeScrumTransfer } = require('../models/lib/scrumTransfer');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const reasons = board => board.unsupported.concat(board.scrumLosses || []).map(u => u.reason).join('\n');

  await test('statuses become lists and stories cards, in kanban order, with their fields', () => {
    const board = parseTaiga(fixture());
    assert.equal(board.board.name, 'Website relaunch');
    assert.deepEqual(board.columns.map(c => c.title), ['New', 'Ready', 'In progress', 'Done', 'Archived', 'Needs Info'],
      'story statuses by order, then the issue status the board needs');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Default', 'Epics', 'Issues']);
    assert.deepEqual(board.tasks.map(t => t.title),
      ['Design hero', 'Write copy', 'Old landing page', 'Intro paragraph', 'Outro paragraph', 'Content', 'Broken footer link']);
    const story = board.tasks[1];
    assert.equal(story.ref, 'us-1');
    assert.equal(story.column_name, 'In progress');
    assert.equal(story.swimlane_name, 'Default');
    assert.equal(story.description, 'Draft the **intro**');
    assert.deepEqual(story.tags, ['copy', 'seo']);
    assert.equal(story.owner_username, 'ann@example.com');
    assert.deepEqual(story.assignees, ['bob@example.com']);
    assert.equal(story.requested_by, 'carol@example.com');
    assert.deepEqual(story.watchers, ['bob@example.com']);
    assert.equal(story.date_due, '2024-03-15T00:00:00.000Z');
    assert.equal(story.date_creation, '2024-03-01T10:20:00.000Z');
    assert.equal(story.parent_ref, 'epic-7', 'its epic is its parent');
    assert.deepEqual(story.dependencies, [{ ref: 'issue-6', type: 'related-to' }], 'the issue it was generated from');
    assert.deepEqual(story.custom_fields, { Audience: 'Customers', Words: 800, Blocked: 'Waiting for the brand guide',
      'Due date reason': 'Launch', 'Story points': 5 }, 'points of computable roles only: UX 3 + Design 2');
    assert.deepEqual(board.tasks[0].custom_fields, { 'Client requirement': true });
    assert.equal(board.tasks[2].archived, true, 'a story in an archived status');
    assert.equal(board.tasks[2].date_end, '2024-02-10T10:00:00.000Z');
    assert.equal(board.tasks[0].archived, undefined);
  });

  await test('comments come from history entries; changes and deleted comments do not', () => {
    const story = parseTaiga(fixture()).tasks[1];
    assert.deepEqual(story.comments, [{ text: 'Looks good', author: 'ann@example.com', authorName: 'Ann',
      date: '2024-03-01T11:00:00.000Z' }]);
    const plan = planImportedTask(story);
    assert.deepEqual(plan.comments.map(c => c.text), ['Ann: Looks good'], 'an unmapped author is named in the text');
    assert.equal(plan.card.requestedBy, 'carol@example.com');
    assert.equal(plan.card.dueAt.toISOString(), '2024-03-15T00:00:00.000Z');
  });

  await test('tasks are subtask cards of their story, beside it, with their own status', () => {
    const board = parseTaiga(fixture());
    const [intro, outro] = board.tasks.slice(3, 5);
    assert.deepEqual([intro.title, outro.title], ['Intro paragraph', 'Outro paragraph'], 'by us_order');
    assert.equal(intro.parent_ref, 'us-1');
    assert.equal(intro.column_name, 'In progress', "the story's list");
    assert.equal(intro.owner_username, 'dave@example.com');
    assert.deepEqual(intro.custom_fields, { 'Task status': 'In progress', Iocaine: true });
    assert.deepEqual(intro.comments.map(c => c.text), ['First draft is in']);
    assert.equal(intro.date_due, '2024-03-10T00:00:00.000Z');
    assert.equal(outro.date_end, '2024-03-03T10:40:00.000Z');
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.parents.map(p => [board.tasks[p.index].title, board.tasks[p.parent].title]), [
      ['Write copy', 'Content'], ['Intro paragraph', 'Write copy'], ['Outro paragraph', 'Write copy']]);
    assert.deepEqual(links.unsupported, []);
    assert.deepEqual(links.dependencies.map(d => [board.tasks[d.index].title, board.tasks[d.deps[0].target].title]),
      [['Write copy', 'Broken footer link']]);
  });

  await test('epics and issues get swimlanes of their own; issue facets become labels', () => {
    const board = parseTaiga(fixture());
    const epic = board.tasks.find(t => t.ref === 'epic-7');
    assert.equal(epic.swimlane_name, 'Epics');
    assert.equal(epic.column_name, 'In progress');
    assert.equal(epic.color, '#E44057');
    assert.equal(planImportedTask(epic).card.color, '#e44057', 'the creator keeps a hex card color');
    assert.deepEqual(epic.custom_fields, { 'Team requirement': true });
    const issue = board.tasks.find(t => t.ref === 'issue-6');
    assert.equal(issue.swimlane_name, 'Issues');
    assert.equal(issue.column_name, 'Needs Info');
    assert.deepEqual(issue.tags, ['type:Bug', 'priority:High', 'severity:Critical']);
  });

  await test('tag colors become the nearest WeKan label colors', () => {
    const board = parseTaiga(fixture());
    assert.deepEqual(board.label_colors, { copy: 'red', design: 'slateblue' }, 'seo has no color and stays black');
    assert.equal(wekanLabelColor('#40B000'), 'green');
    assert.equal(wekanLabelColor('#000080'), 'navy');
    assert.equal(wekanLabelColor('not a color'), undefined);
    // Older Taiga versions stored a tag as [name, color].
    const old = parseTaiga({ user_stories: [{ ref: 1, subject: 'A', tags: [['legacy', '#ffd700']] }] });
    assert.deepEqual(old.tasks[0].tags, ['legacy']);
    assert.deepEqual(old.label_colors, { legacy: 'gold' });
  });

  await test('custom fields are typed from the values present', () => {
    const { fields } = planImportedCustomFields(parseTaiga(fixture()).tasks);
    const types = Object.fromEntries(fields.map(f => [f.name, f.type]));
    assert.equal(types.Audience, 'text');
    assert.equal(types.Words, 'number');
    assert.equal(types['Story points'], 'number', 'the Scrum estimate must be numeric');
    assert.equal(types['Client requirement'], 'checkbox');
  });

  await test('open sprints become Scrum sprints with backlog ranks; a closed one is reported', () => {
    const board = parseTaiga(fixture());
    const transfer = board.scrumTransfer;
    assert.doesNotThrow(() => normalizeScrumTransfer(transfer), 'a valid native transfer');
    assert.deepEqual(transfer.settings, { enabled: true, estimateSource: 'customField',
      estimateCustomFieldId: 'Story points', estimateUnit: 'points' });
    assert.deepEqual(transfer.sprints.map(s => [s._id, s.name, s.state, s.plannedStart.toISOString().slice(0, 10),
      s.plannedEnd.toISOString().slice(0, 10), s.provenance.system]),
    [['taiga-sprint-sprint-1', 'Sprint 1', 'planned', '2024-03-01', '2024-03-14', 'taiga']]);
    const byCard = Object.fromEntries(transfer.cards.map(c => [board.tasks[Number(c._id.slice(5))].title, c.scrum]));
    assert.deepEqual(byCard, {
      'Design hero': { backlogRank: 1 },
      'Write copy': { sprintId: 'taiga-sprint-sprint-1', backlogRank: 2 },
      'Old landing page': { backlogRank: 3 },
      'Intro paragraph': { sprintId: 'taiga-sprint-sprint-1' },
      'Outro paragraph': { sprintId: 'taiga-sprint-sprint-1' },
    });
    assert.match(reasons(board), /closed sprint "Sprint 0" is not imported/);
  });

  await test('what has no place on a board is reported, never dropped silently', () => {
    const text = reasons(parseTaiga(fixture()));
    for (const pattern of [/1 attachment\(s\) are not imported/, /1 wiki page\(s\)/, /1 wiki link\(s\)/,
      /timeline \(2 event\(s\)\)/, /1 issue vote\(s\)/, /WIP limits of 1 status/, /2 project member\(s\)/,
      /a story of project "other-project" is not part of this import/]) {
      assert.match(text, pattern);
    }
    const quiet = parseTaiga({ name: 'Bare', us_statuses: [{ name: 'New', order: 1 }],
      user_stories: [{ ref: 1, subject: 'Only', status: 'New' }] });
    assert.deepEqual(quiet.unsupported, [], 'a dump with nothing extra reports nothing');
    assert.equal(quiet.scrumTransfer, undefined);
  });

  await test('Taiga swimlanes are kept; a story without one is Unclassified', () => {
    const board = parseTaiga({ name: 'Lanes', us_statuses: [{ name: 'New', order: 1 }],
      swimlanes: [{ name: 'Backend', order: 2, statuses: [] }, { name: 'Frontend', order: 1, statuses: [] }],
      user_stories: [{ ref: 1, subject: 'A', status: 'New', swimlane: 'Backend' },
        { ref: 2, subject: 'B', status: 'New', swimlane: null }, { ref: 3, subject: 'C', status: 'Gone' }] });
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Frontend', 'Backend', 'Unclassified']);
    assert.deepEqual(board.tasks.map(t => t.swimlane_name), ['Backend', 'Unclassified', 'Unclassified']);
    assert.deepEqual(board.columns.map(c => c.title), ['New', 'Gone'], 'a status the dump does not list still gets a list');
  });

  await test('Taiga dates: its own format, ISO and plain dates; anything else is reported', () => {
    assert.equal(taigaDate('2024-03-01T10:15:00+0000'), '2024-03-01T10:15:00.000Z');
    assert.equal(taigaDate('2024-03-01T12:15:00+0200'), '2024-03-01T10:15:00.000Z');
    assert.equal(taigaDate('2024-03-01T10:15:00Z'), '2024-03-01T10:15:00.000Z');
    assert.equal(taigaDate('2024-03-15'), '2024-03-15T00:00:00.000Z');
    assert.equal(taigaDate(null), undefined);
    assert.equal(taigaDate('next week'), null);
    assert.equal(taigaDate('2024-02-31T00:00:00+0000'), null);
    assert.equal(taigaDateTimeText('2024-03-01T10:15:00.000Z'), '2024-03-01T10:15:00+0000');
    const board = parseTaiga({ user_stories: [{ ref: 1, subject: 'A', due_date: 'soon' }] });
    assert.equal(board.tasks[0].date_due, undefined);
    assert.deepEqual(board.unsupported, [{ path: '/user_stories/0/due_date', reason: 'a date that is not a date is left out' }]);
  });

  await test('negative: not a dump, no user stories, too many items, bad sprint references', () => {
    assert.throws(() => parseTaiga('{broken'), /must be JSON/);
    assert.throws(() => parseTaiga([]), /one JSON object/);
    assert.throws(() => parseTaiga(null), /one JSON object/);
    assert.throws(() => parseTaiga({ name: 'x', tasks: [] }), /user_stories/);
    assert.throws(() => parseTaiga({ user_stories: [], tasks: new Array(MAX_TAIGA_ITEMS + 1).fill({}) }), /more than/);
    assert.equal(parseTaiga(JSON.stringify(fixture())).tasks.length, 7, 'text is parsed too');
    const board = parseTaiga({ user_stories: [{ ref: 1, subject: 'A', milestone: 'Nope' }],
      milestones: [{ name: 'S', estimated_start: '2024-01-01', estimated_finish: '2024-01-02' },
        { name: 'S', estimated_start: '2024-01-01', estimated_finish: '2024-01-02' }, { name: '' }] });
    const text = reasons(board);
    assert.match(text, /sprint "Nope" is not among the dump's milestones/);
    assert.match(text, /sprint "S" is listed twice/);
    assert.match(text, /a sprint without a name is not imported/);
    // A task whose story is not in the dump is still imported, and the
    // broken parent link is reported by the shared link planner.
    const orphan = parseTaiga({ user_stories: [], tasks: [{ ref: 2, subject: 'Lonely', user_story: 99 }] });
    assert.equal(orphan.tasks[0].column_name, 'New');
    assert.deepEqual(planImportedLinks(orphan.tasks).unsupported, [{ path: '/tasks/0/parent_ref', reason: 'parent is not part of this import' }]);
  });

  await test('the shape check accepts a dump and refuses other documents', () => {
    assert.doesNotThrow(() => validateImportSourceShape('taiga', fixture()));
    assert.doesNotThrow(() => validateImportSourceShape('taiga', { user_stories: [] }));
    for (const bad of [{}, { unrelated: [] }, [], 'text', { user_stories: {} }]) {
      assert.throws(() => validateImportSourceShape('taiga', bad), /Invalid taiga import/);
    }
  });

  await test('the browser leaves the embedded files out, and the count stays', () => {
    const dump = fixture();
    const slim = slimTaigaDump(dump);
    assert.equal(slim.user_stories[1 - 1].attachments[0].attached_file, null);
    assert.equal(slim.user_stories[0].attachments[0].name, 'brief.txt');
    assert.equal(dump.user_stories[0].attachments[0].attached_file.data, 'SGVsbG8=', 'the input is not changed');
    assert.ok(!JSON.stringify(slim).includes('SGVsbG8='));
    assert.match(reasons(parseTaiga(slim)), /1 attachment\(s\) are not imported/);
    assert.equal(slimTaigaDump('x'), 'x');
  });

  await test('export: every key Taiga writes, and every name it refers to exists', () => {
    const parsed = parseTaiga(fixture());
    const collected = collectedFrom(parsed);
    collected.items[1].checklists = [{ title: 'Review', items: [{ title: 'Spelling', done: true }, { title: 'Links', done: false }]}];
    collected.items[5].checklists = [{ title: 'Scope', items: [{ title: 'Home page', done: false }] }];
    const dump = formatTaiga(collected, new Date('2026-10-08T12:00:00Z'));
    assert.deepEqual(Object.keys(dump), PROJECT_KEYS, 'the keys of ProjectExportSerializer, in its order');
    for (const story of dump.user_stories) assert.deepEqual(Object.keys(story).sort(), [...STORY_KEYS].sort());
    for (const task of dump.tasks) assert.deepEqual(Object.keys(task).sort(), TASK_KEYS.sort());
    for (const issue of dump.issues) assert.deepEqual(Object.keys(issue).sort(), ISSUE_KEYS.sort());
    for (const epic of dump.epics) assert.deepEqual(Object.keys(epic).sort(), EPIC_KEYS.sort());
    for (const milestone of dump.milestones) assert.deepEqual(Object.keys(milestone), MILESTONE_KEYS);

    // load_dump looks every one of these up by name and fails when one is missing.
    const names = key => new Set(dump[key].map(row => row.name));
    const refs = [...dump.epics, ...dump.user_stories, ...dump.tasks, ...dump.issues].map(row => row.ref);
    assert.equal(new Set(refs).size, refs.length, 'one ref sequence, no duplicates');
    const storyRefs = new Set(dump.user_stories.map(s => s.ref));
    for (const story of dump.user_stories) {
      assert.ok(names('us_statuses').has(story.status), story.status);
      assert.ok(story.milestone === null || names('milestones').has(story.milestone));
      assert.ok(story.swimlane === null || names('swimlanes').has(story.swimlane));
      for (const rp of story.role_points) {
        assert.ok(names('roles').has(rp.role));
        assert.ok(names('points').has(rp.points));
      }
    }
    for (const task of dump.tasks) {
      assert.ok(names('task_statuses').has(task.status), task.status);
      assert.ok(task.user_story === null || storyRefs.has(task.user_story));
    }
    for (const issue of dump.issues) {
      assert.ok(names('issue_statuses').has(issue.status));
      assert.ok(names('issue_types').has(issue.type));
      assert.ok(names('priorities').has(issue.priority));
      assert.ok(names('severities').has(issue.severity));
    }
    for (const epic of dump.epics) {
      assert.ok(names('epic_statuses').has(epic.status));
      for (const link of epic.related_user_stories) assert.ok(storyRefs.has(link.user_story));
    }
    for (const key of ['default_us_status', 'default_task_status', 'default_epic_status', 'default_issue_status']) {
      const table = { default_us_status: 'us_statuses', default_task_status: 'task_statuses',
        default_epic_status: 'epic_statuses', default_issue_status: 'issue_statuses' }[key];
      assert.ok(names(table).has(dump[key]), key);
    }
    assert.ok(names('points').has(dump.default_points));
    for (const table of ['us_statuses', 'task_statuses', 'issue_statuses', 'epic_statuses', 'milestones']) {
      const slugs = dump[table].map(row => row.slug);
      assert.equal(new Set(slugs).size, slugs.length, `${table}: unique slugs`);
    }
    const dates = [dump.created_date, ...dump.user_stories.flatMap(s => [s.created_date, s.modified_date, s.due_date,
      ...s.history.map(h => h.created_at)]), ...dump.tasks.map(t => t.created_date)].filter(Boolean);
    for (const value of dates) assert.match(value, TAIGA_DATETIME);
    assert.deepEqual(dump.milestones.map(m => [m.name, m.estimated_start, m.estimated_finish, m.closed]),
      [['Sprint 1', '2024-03-01', '2024-03-14', false]]);
    assert.deepEqual(dump.tags_colors.find(([name]) => name === 'copy'), ['copy', '#eb4646']);
    assert.ok(!dump.tags_colors.some(([name]) => name.startsWith('type:')), 'issue facets are not tags');

    const story = dump.user_stories.find(s => s.subject === 'Write copy');
    assert.equal(story.status, 'In progress');
    assert.equal(story.milestone, 'Sprint 1');
    assert.equal(story.is_blocked, true);
    assert.equal(story.blocked_note, 'Waiting for the brand guide');
    assert.equal(story.due_date_reason, 'Launch');
    assert.deepEqual(story.role_points, [{ role: 'Team', points: '5' }]);
    assert.deepEqual(story.custom_attributes_values, { Audience: 'Customers', Words: 800 });
    assert.deepEqual(dump.userstorycustomattributes.map(a => [a.name, a.type]), [['Audience', 'text'], ['Words', 'number']]);
    assert.equal(story.history[0].comment, 'Looks good');
    assert.deepEqual(story.history[0].user, ['ann@example.com', 'ann@example.com']);
    assert.equal(story.history[0].created_at, '2024-03-01T11:00:00+0000');
    assert.deepEqual(story.assigned_users, ['ann@example.com', 'bob@example.com']);
    assert.equal(story.owner, 'carol@example.com');
    // A story's checklist items are tasks; other items get a Markdown list.
    const subjects = dump.tasks.filter(t => t.user_story === story.ref).map(t => [t.subject, t.status]);
    assert.deepEqual(subjects, [['Intro paragraph', 'In progress'], ['Outro paragraph', 'Closed'],
      ['Spelling', 'Closed'], ['Links', 'New']]);
    const epic = dump.epics[0];
    assert.equal(epic.color, '#e44057');
    assert.match(epic.description, /### Scope\n- \[ \] Home page/);
    assert.deepEqual(epic.related_user_stories, [{ user_story: story.ref, order: 1, source_project_slug: null }]);
    const issue = dump.issues[0];
    assert.deepEqual([issue.type, issue.priority, issue.severity, issue.status], ['Bug', 'High', 'Critical', 'Needs Info']);
    assert.deepEqual(issue.tags, []);
    assert.equal(dump.swimlanes.length, 0, 'a board with only Default has no Taiga swimlanes');
  });

  await test('round trip: a dump read, exported and read again keeps the board', () => {
    const first = parseTaiga(fixture());
    const again = parseTaiga(formatTaiga(collectedFrom(first)));
    assert.deepEqual(again.columns.map(c => c.title), first.columns.map(c => c.title));
    assert.deepEqual(again.swimlanes.map(s => s.name), first.swimlanes.map(s => s.name));
    const shape = board => board.tasks.map(t => ({
      title: t.title, list: t.column_name, lane: t.swimlane_name, tags: t.tags,
      parent: t.parent_ref ? board.tasks.find(p => p.ref === t.parent_ref).title : null,
      comments: t.comments.map(c => c.text), due: t.date_due || null, owner: t.owner_username || null,
      assignees: t.assignees || [], fields: t.custom_fields, color: t.color ? t.color.toLowerCase() : null,
    })).sort((a, b) => a.title.localeCompare(b.title));
    assert.deepEqual(shape(again), shape(first));
    // A tag without a color is a black label, which goes out with black's hex.
    const colored = colors => Object.fromEntries(Object.entries(colors || {}).filter(([, color]) => color !== 'black'));
    assert.deepEqual(colored(again.label_colors), first.label_colors);
    assert.deepEqual(again.scrumTransfer.sprints.map(s => s.name), ['Sprint 1']);
    assert.equal(again.scrumTransfer.cards.filter(c => c.scrum.sprintId).length, 3);
  });

  await test('round trip from WeKan: swimlanes, subtasks and sprints survive', () => {
    const collected = {
      board: { _id: 'b', title: 'Ops', labels: [{ name: 'urgent', color: 'crimson' }] },
      lists: [{ _id: 'l1', title: 'To do', wipLimit: { enabled: true, value: 4 } }, { _id: 'l2', title: 'Done' }],
      swimlanes: [{ _id: 's1', title: 'Team A' }, { _id: 's2', title: 'Team B' }],
      scrumSprints: [{ _id: 'sp1', name: 'Sprint 9', state: 'active', plannedStart: '2026-10-01T00:00:00.000Z',
        plannedEnd: '2026-10-14T00:00:00.000Z' }, { _id: 'sp2', name: 'Someday', state: 'planned' }],
      items: [
        { cardId: 'c1', listId: 'l1', listTitle: 'To do', swimlaneTitle: 'Team B', title: 'Patch', labels: ['urgent'],
          scrum: { sprintId: 'sp1', backlogRank: 1 }, customFields: { 'Story points': 8 } },
        { cardId: 'c2', listId: 'l2', listTitle: 'Done', swimlaneTitle: 'Team B', title: 'Reboot', parentCardId: 'c1',
          endAt: '2026-10-02T08:00:00.000Z' },
        { cardId: 'c3', listId: 'l2', listTitle: 'Done', swimlaneTitle: 'Team A', title: 'Log', parentCardId: 'c2',
          scrum: { sprintId: 'sp2' } },
      ],
    };
    const dump = formatTaiga(collected);
    assert.deepEqual(dump.swimlanes.map(s => [s.name, s.statuses.map(st => st.status)]),
      [['Team A', ['To do', 'Done']], ['Team B', ['To do', 'Done']]]);
    assert.equal(dump.us_statuses[0].wip_limit, 4);
    assert.equal(dump.us_statuses[1].is_closed, true);
    assert.deepEqual(dump.milestones.map(m => m.name), ['Sprint 9'], 'a sprint without dates cannot be a Taiga milestone');
    assert.equal(dump.user_stories.length, 1);
    assert.deepEqual(dump.tasks.map(t => [t.subject, t.user_story, t.status, t.milestone]),
      [['Reboot', 1, 'Closed', 'Sprint 9'], ['Log', 1, 'New', 'Sprint 9']], 'a subtask of a subtask belongs to the same story');
    const back = parseTaiga(dump);
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Team A', 'Team B']);
    assert.deepEqual(back.tasks.map(t => [t.title, t.swimlane_name, t.parent_ref || null]),
      [['Patch', 'Team B', null], ['Reboot', 'Team B', 'us-1'], ['Log', 'Team B', 'us-1']]);
    assert.deepEqual(back.label_colors, { urgent: 'crimson' });
    assert.equal(back.tasks[0].custom_fields['Story points'], 8);
    assert.match(reasons(back), /WIP limits of 1 status/);
  });

  await test('wiring: parser, formatter, route, menu, import page and guards know Taiga', () => {
    assert.equal(EXTERNAL_PARSERS.taiga, parseTaiga);
    assert.ok(EXTERNAL_EXPORT_FORMATS.includes('taiga'));
    assert.deepEqual(Object.keys(formatters.taiga({ board: { title: 'x' }, lists: [], swimlanes: [], items: [] })), PROJECT_KEYS);
    const importJs = read('models/import.js');
    assert.match(importJs, /case 'taiga':[\s\S]*?check\(board, Object\);[\s\S]*?EXTERNAL_PARSERS\.taiga\(importedBoard\)[\s\S]*?new KanboardCreator\(data, 'taiga'\)/);
    const client = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'taiga', name: 'Taiga', \.\.\.JSON_SOURCE \}/); // the one list of sources
    assert.match(client, /if \(dataSource === 'taiga'\) doc = slimTaigaDump\(doc\);/);
    assert.match(read('client/components/boards/exportScope.js'), /\['taiga', 'Taiga'\]/);
    assert.match(read('models/lib/externalExporters.js'), /SCRUM_FORMATS = new Set\(\[[^\]]*'taiga'/);
    const creator = read('models/kanboardCreator.js');
    // The creator merges a tag's own color (Kanri) with the board's
    // label_colors map (Taiga); only a WeKan label color is stored.
    assert.match(creator, /const sourceColors = data\.label_colors && typeof data\.label_colors === 'object' \? data\.label_colors : \{\};/);
    assert.match(creator, /color === 'black' && LABEL_COLORS\.includes\(named\) \? named : color/, 'only a WeKan label color is stored');
    // Its details are on its own page, which the coverage index links.
    const docPage = read('docs/Features/ImportExport/Taiga/Taiga.md');
    assert.match(docPage, /^## Format details$/m);
    assert.match(read('docs/Features/ImportExport/Format-Coverage.md'), /\]\(\.\/Taiga\/Taiga\.md\)/);
    // Named in both the import and the export list.
    assert.ok((read('README.md').match(/\bTaiga\b/g) || []).length >= 2);
    // No link in the module's comments (tests/releaseTelemetry*.cjs).
    assert.doesNotMatch(read('models/lib/taigaFormat.js'), /https?:\/\//);
  });

  console.log(`taigaFormat: ${passed} passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
