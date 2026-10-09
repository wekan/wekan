'use strict';

// Vikunja's user data export (Settings > Data Export): import and export
// (models/lib/vikunjaFormat.js, server/lib/vikunjaArchive.js). The zip holds
// data.json, filters.json, VERSION and files/<id>, as Vikunja's
// pkg/models/export.go writes it and its "Vikunja Export" migrator
// (pkg/modules/migration/vikunja-file) reads it back. The fixtures below are
// built from that documented structure, in both the current layout (project
// views, buckets per view, task_buckets, positions) and the 0.21 layout
// (bucket_id on the task, is_done_bucket on the bucket).
// Run: node tests/vikunjaFormat.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');
const { readVikunjaImport, readVikunjaArchive, writeVikunjaArchive, MAX_VIKUNJA_ZIP_BYTES } =
  require('../server/lib/vikunjaArchive');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const T = '2025-05-01T10:00:00Z';
const ZERO = '0001-01-01T00:00:00Z';
const user = (id, username) => ({ id, name: '', username, created: T, updated: T });

// A zip as Vikunja writes it.
const zip = (files, options) => Buffer.from(zipSync(Object.fromEntries(Object.entries(files)
  .map(([name, value]) => [name, typeof value === 'string' ? strToU8(value) : value])), options));
const exportZip = (projects, { version = 'v1.0.0', extra = {} } = {}) => zip({
  'data.json': JSON.stringify(projects), 'filters.json': '[{"id":1,"title":"Mine"}]', VERSION: version, ...extra,
}).toString('base64');

// The current layout: the research sample, plus a second task and a done one.
function currentProject() {
  return {
    id: 3, title: 'Website', description: '<p>Our site</p>', identifier: 'WEB', hex_color: '1973ff',
    parent_project_id: 0, is_archived: false, background_information: null, position: 65536, created: T, updated: T,
    views: [
      { id: 11, title: 'List', project_id: 3, view_kind: 'list', position: 100, bucket_configuration_mode: 'none', default_bucket_id: 0, done_bucket_id: 0 },
      { id: 12, title: 'Kanban', project_id: 3, view_kind: 'kanban', position: 400, bucket_configuration_mode: 'manual', default_bucket_id: 20, done_bucket_id: 21 },
    ],
    child_projects: null,
    tasks: [
      {
        id: 101, title: 'Write copy',
        description: '<p>Draft <strong>now</strong> &amp; <a href="https://example.org/brief">brief</a></p><ul data-type="taskList"><li data-checked="false" data-type="taskItem"><p>Intro</p></li><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>Outro</p></div></li></ul>',
        done: false, done_at: ZERO, due_date: '2025-06-01T12:00:00Z', start_date: '2025-05-20T08:00:00Z', end_date: ZERO,
        priority: 3, hex_color: 'e8e8e8', percent_done: 0.5, index: 1, project_id: 3, repeat_after: 86400, repeat_mode: 0,
        reminders: [{ reminder: '2025-05-31T12:00:00Z', relative_period: -86400, relative_to: 'due_date' }],
        assignees: [user(1, 'ann'), user(2, 'bob')],
        labels: [{ id: 4, title: 'copy', description: '', hex_color: 'e8e8e8', created: T, updated: T }],
        attachments: [{ id: 9, task_id: 101, file: { id: 7, name: 'brief.pdf', mime: 'application/pdf', size: 4, created: T }, created: T }],
        related_tasks: { blocking: [{ id: 102 }] }, cover_image_attachment_id: 0, created: T, updated: T,
        created_by: user(3, 'carol'),
        comments: [{ id: 5, comment: '<p>Looks <em>good</em></p>', author: user(1, 'ann'), created: '2025-05-01T11:00:00Z', updated: T }],
      },
      {
        id: 102, title: 'Publish', description: '', done: true, done_at: '2025-05-05T09:00:00Z', due_date: ZERO, start_date: ZERO,
        end_date: ZERO, priority: 0, hex_color: '', percent_done: 0, index: 2, project_id: 3, repeat_after: 0, repeat_mode: 0,
        reminders: null, assignees: null, labels: null, attachments: null,
        related_tasks: { blocked: [{ id: 101 }], precedes: [{ id: 103 }] }, created: T, updated: T,
      },
      { id: 103, title: 'Plan next', description: 'Old **Markdown** text', done: false, due_date: ZERO, priority: 1, created: T, updated: T },
    ],
    buckets: [
      { id: 21, title: 'Done', project_view_id: 12, limit: 0, position: 131072, created: T, updated: T },
      { id: 20, title: 'To-Do', project_view_id: 12, limit: 3, position: 65536, created: T, updated: T },
    ],
    task_buckets: [
      { bucket_id: 20, task_id: 101, project_view_id: 12 },
      { bucket_id: 21, task_id: 102, project_view_id: 12 },
      { bucket_id: 20, task_id: 103, project_view_id: 12 },
    ],
    positions: [
      { task_id: 101, project_view_id: 12, position: 131072 },
      { task_id: 103, project_view_id: 12, position: 65536 },
      { task_id: 102, project_view_id: 12, position: 65536 },
    ],
    background_file_id: 0,
  };
}

// The 0.21 layout, as Vikunja's own export.zip test fixture has it.
function legacyProject() {
  return {
    id: 1, title: 'Old project', hex_color: '', is_archived: false, position: 1,
    tasks: [
      { id: 1, title: 'Second', description: '', done: false, bucket_id: 2, kanban_position: 2, due_date: null, reminder_dates: ['2021-01-01T00:00:00Z'] },
      { id: 2, title: 'First', description: '', done: false, bucket_id: 2, kanban_position: 1 },
      { id: 3, title: 'Finished', description: '', done: true, done_at: '2021-02-02T00:00:00Z', bucket_id: 0, kanban_position: 3 },
    ],
    buckets: [
      { id: 2, title: 'Backlog', project_id: 1, limit: 0, position: 1, is_done_bucket: false },
      { id: 3, title: 'Finished', project_id: 1, limit: 0, position: 2, is_done_bucket: true },
    ],
  };
}

async function main() {
  const fmt = await import('../models/lib/vikunjaFormat.js');
  const { parseVikunjaExport, formatVikunja, vikunjaArchiveFiles, vikunjaHtmlToText, vikunjaHtml, vikunjaDate,
    parseVikunjaVersion, vikunjaPriority } = fmt;
  const { EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');
  const { validateImportSourceShape } = await import('../models/lib/importSourceShape.js');
  const { planImportedTask, planImportedLinks, planImportedCustomFields } = await import('../models/lib/importedTaskPlan.js');
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const importZip = async base64 => parseVikunjaExport(await readVikunjaImport({ zipBase64: base64 }));

  await test('a current-layout export maps buckets, tasks, people, dates, labels, checklist, comments and fields', async () => {
    const board = await importZip(exportZip([currentProject()]));
    assert.equal(board.board.name, 'Website');
    assert.deepEqual(board.columns.map(c => c.title), ['To-Do', 'Done'], 'buckets in position order');
    assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
    assert.deepEqual(board.tasks.map(t => t.title), ['Publish', 'Plan next', 'Write copy'], 'the kanban view\'s task positions');
    const write = board.tasks.find(t => t.title === 'Write copy');
    assert.equal(write.column_name, 'To-Do');
    assert.equal(write.ref, '101');
    assert.equal(write.description, 'Draft **now** & [brief](https://example.org/brief)');
    assert.deepEqual(write.checklists, [{ title: 'Checklist', items: [{ title: 'Intro', done: false }, { title: 'Outro', done: true }] }]);
    assert.equal(write.owner_username, 'ann');
    assert.deepEqual(write.assignees, ['bob']);
    assert.equal(write.requested_by, 'carol');
    assert.equal(write.date_due, '2025-06-01T12:00:00.000Z');
    assert.equal(write.date_started, '2025-05-20T08:00:00.000Z');
    assert.equal(write.date_end, undefined, 'Go\'s zero time is no date');
    assert.equal(write.date_creation, '2025-05-01T10:00:00.000Z');
    assert.equal(write.color, 'e8e8e8');
    assert.deepEqual(write.tags, ['copy']);
    assert.deepEqual(write.custom_fields, { Priority: 'High', 'Percent Done': 50 });
    assert.deepEqual(write.comments, [{ text: 'Looks _good_', author: 'ann', date: '2025-05-01T11:00:00.000Z' }]);
    // Vikunja writes a link from both sides; it is kept once, from the side read first.
    assert.equal(write.dependencies, undefined);
    const publish = board.tasks.find(t => t.title === 'Publish');
    assert.equal(publish.column_name, 'Done');
    assert.deepEqual(publish.custom_fields, { Done: true });
    assert.equal(publish.date_end, '2025-05-05T09:00:00.000Z', 'done_at is the end date when end_date is unset');
    assert.deepEqual(publish.dependencies, [{ ref: '101', type: 'is-blocked-by' }], 'blocked is the same link as blocking');
    const plan = board.tasks.find(t => t.title === 'Plan next');
    assert.equal(plan.description, 'Old **Markdown** text', 'pre-HTML descriptions stay as they are');
    assert.deepEqual(plan.custom_fields, { Priority: 'Low' });
    const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`).join('\n');
    for (const pattern of [/attachment "brief\.pdf" .*files\/7/, /reminders .*1 reminder/, /repeat_after .*repeat/,
      /related_tasks\/precedes .*"precedes"/, /hex_color the project color/, /description the project description/,
      /buckets\/20\/limit .*limit of 3/, /\/labels .*label colors/, /filters\.json 1 saved filter/]) {
      assert.match(reasons, pattern);
    }
    // What KanboardCreator then writes.
    const card = planImportedTask(write, { members: { ann: 'u1', bob: 'u2' }, allowedColors: ['green'] });
    assert.deepEqual(card.memberIds, ['u1', 'u2']);
    assert.equal(card.card.color, '#e8e8e8');
    assert.equal(card.checklists[0].items[1].isFinished, true);
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.dependencies.map(d => d.deps[0].type), ['is-blocked-by']);
    assert.ok(links.unsupported.every(u => !/linked item/.test(u.reason)));
    const fields = planImportedCustomFields(board.tasks).fields;
    assert.deepEqual(fields.map(f => `${f.name}:${f.type}`).sort(), ['Done:checkbox', 'Percent Done:number', 'Priority:text']);
  });

  await test('the 0.21 layout: bucket_id, kanban_position and the done bucket', async () => {
    const board = await importZip(exportZip([legacyProject()], { version: '0.21.0' }));
    assert.deepEqual(board.columns.map(c => c.title), ['Backlog', 'Finished']);
    assert.deepEqual(board.tasks.map(t => `${t.title}@${t.column_name}`), ['First@Backlog', 'Second@Backlog', 'Finished@Finished']);
    assert.ok(board.unsupported.some(u => /reminder/.test(u.reason)), 'reminder_dates of the old layout');
  });

  await test('several projects become swimlanes under their parent; subtasks become parent cards', async () => {
    const parent = { id: 10, title: 'Company', parent_project_id: 0, tasks: [], views: [], buckets: [] };
    const a = { ...currentProject(), id: 11, title: 'Web', parent_project_id: 10, hex_color: '', description: '' };
    a.tasks = [{ id: 201, title: 'Parent', related_tasks: { subtask: [{ id: 202 }], related: [{ id: 301 }] } },
      { id: 202, title: 'Child', related_tasks: { parenttask: [{ id: 201 }] } }];
    a.task_buckets = []; a.positions = [];
    const b = { id: 12, title: 'Ops', parent_project_id: 10, tasks: [{ id: 301, title: 'Server', done: false, related_tasks: { related: [{ id: 201 }] } }] };
    const inbox = { id: 1, title: 'Inbox', parent_project_id: 0, tasks: [] };
    const board = parseVikunjaExport(JSON.stringify([inbox, parent, a, b]));
    assert.equal(board.board.name, 'Company');
    assert.deepEqual(board.swimlanes.map(s => s.name), ['Web', 'Ops']);
    assert.deepEqual(board.tasks.map(t => `${t.title}/${t.swimlane_name}/${t.column_name}`),
      ['Parent/Web/To-Do', 'Child/Web/To-Do', 'Server/Ops/To-Do'], 'no buckets: Vikunja\'s default To-Do');
    assert.equal(board.tasks[1].parent_ref, '201');
    assert.deepEqual(board.tasks[0].dependencies, [{ ref: '301', type: 'related-to' }]);
    assert.equal(board.tasks[2].dependencies, undefined, 'a related pair is one link');
    const links = planImportedLinks(board.tasks);
    assert.deepEqual(links.parents, [{ index: 1, parent: 0 }]);
    assert.match(board.unsupported.map(u => u.reason).join('\n'), /"Inbox" has no tasks/);
    // A subtask link written only on the parent still makes the tree.
    delete a.tasks[1].related_tasks;
    assert.equal(parseVikunjaExport([a]).tasks[1].parent_ref, '201');
  });

  await test('HTML: headings name checklists, lists and entities read as Markdown text', async () => {
    const { text, checklists } = vikunjaHtmlToText('<h2>Notes</h2><p>a &lt;b&gt; c&nbsp;d<br>next</p><ol><li><p>one</p></li><li><p>two</p></li></ol>'
      + '<h3>Launch</h3><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>Go</p></li></ul>'
      + '<ul data-type="taskList"><li data-checked="false" data-type="taskItem"><p>Later</p></li></ul><pre><code>x  y</code></pre><!-- c -->');
    assert.equal(text, '## Notes\n\na <b> c d\nnext\n\n1. one\n2. two\n\n```\nx  y\n```');
    assert.deepEqual(checklists, [{ title: 'Launch', items: [{ title: 'Go', done: true }] }, { title: 'Checklist', items: [{ title: 'Later', done: false }] }]);
    const comment = vikunjaHtmlToText('<p>See</p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>done</p></li></ul>', { checklists: false });
    assert.deepEqual(comment, { text: 'See\n\n- [x] done', checklists: [] });
    assert.equal(vikunjaHtmlToText('<p><a href="javascript:alert(1)">x</a><img src="data:x" alt="y"></p>').text, 'x', 'only web links are kept');
    // And back: one default-titled list has no heading; named lists do.
    assert.equal(vikunjaHtml('a <b>\n\nc', [{ title: 'Checklist', items: [{ title: 'x', done: true }] }]),
      '<p>a &lt;b&gt;</p><p>c</p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>x</p></li></ul>');
    const two = [{ title: 'A', items: [{ title: '1', done: false }] }, { title: 'B', items: [{ title: '2', done: true }] }];
    assert.deepEqual(vikunjaHtmlToText(vikunjaHtml('Body', two)), { text: 'Body', checklists: two });
    // negative: data.json is the uploader's, so hostile markup stays linear.
    for (const hostile of ['<a x="'.repeat(200000), '<!--'.repeat(200000), '<p> '.repeat(200000), '<a<a'.repeat(200000),
      `<ul data-type="taskList"><li ${'y="'.repeat(100000)}>`]) {
      const started = Date.now();
      vikunjaHtmlToText(hostile);
      assert.ok(Date.now() - started < 2000, `${hostile.slice(0, 8)}... took ${Date.now() - started} ms`);
    }
    assert.equal(vikunjaDate(ZERO), undefined);
    assert.equal(vikunjaDate('2023-01-13T14:55:29Z'), '2023-01-13T14:55:29.000Z');
    assert.deepEqual(parseVikunjaVersion('v0.24.1+12-abc'), [0, 24, 1]);
    assert.equal(vikunjaPriority('DO NOW'), 5);
    assert.equal(vikunjaPriority('Important'), 3, 'Microsoft Planner\'s name');
    assert.equal(vikunjaPriority('whatever'), 0);
  });

  await test('the text of data.json can be pasted, and a data.json file read as text', async () => {
    const text = JSON.stringify([currentProject()]);
    assert.equal(await readVikunjaImport(text), text);
    const board = EXTERNAL_PARSERS.vikunja(await readVikunjaImport(text));
    assert.equal(board.tasks.length, 3);
    assert.ok(!board.unsupported.some(u => u.path === '/VERSION'), 'no VERSION to check without the zip');
    assert.doesNotThrow(() => validateImportSourceShape('vikunja', text));
    assert.doesNotThrow(() => validateImportSourceShape('vikunja', { zipBase64: 'UEsDBA==' }));
  });

  await test('negative: what is not a Vikunja export is refused', async () => {
    assert.throws(() => validateImportSourceShape('vikunja', '  '), /Invalid vikunja/);
    assert.throws(() => validateImportSourceShape('vikunja', { zipBase64: '' }), /Invalid vikunja/);
    assert.throws(() => validateImportSourceShape('vikunja', { excelBase64: 'x' }), /Invalid vikunja/);
    await assert.rejects(readVikunjaImport({}), /empty/);
    await assert.rejects(readVikunjaImport({ zipBase64: Buffer.from('not a zip at all').toString('base64') }), /not a \.zip/);
    // A zip header and then garbage.
    await assert.rejects(readVikunjaArchive(Buffer.concat([Buffer.from([0x50, 0x4b, 3, 4]), Buffer.alloc(64, 7)])), /not a readable \.zip|no data\.json/);
    await assert.rejects(readVikunjaImport({ zipBase64: zip({ VERSION: 'v1.0.0' }).toString('base64') }), /no data\.json/);
    await assert.rejects(readVikunjaImport({ zipBase64: zip({ 'data.json': '[]' }).toString('base64') }), /no VERSION/);
    await assert.rejects(readVikunjaImport({ zipBase64: zip({ 'sub/data.json': '[]', VERSION: 'v1.0.0' }).toString('base64') }), /no data\.json/,
      'data.json is at the root, as Vikunja writes and reads it');
    await assert.rejects(importZip(exportZip([currentProject()], { version: '0.19.0' })), /older than 0\.20\.1/);
    await assert.rejects(importZip(exportZip([currentProject()], { version: 'banana' })), /not a Vikunja version/);
    const dev = await importZip(exportZip([currentProject()], { version: 'dev' }));
    assert.ok(dev.unsupported.some(u => u.path === '/VERSION'), 'a dev build is read, and said');
    assert.throws(() => parseVikunjaExport('{broken'), /not valid JSON/);
    assert.throws(() => parseVikunjaExport('{"projects":[]}'), /array of projects/);
    assert.throws(() => parseVikunjaExport('[]'), /no projects/);
    assert.throws(() => parseVikunjaExport([{ id: -1, title: 'Favorites' }]), /no projects/, 'the Favorites pseudo project');
    assert.throws(() => parseVikunjaExport(''), /empty/);
    assert.throws(() => parseVikunjaExport([{ id: 1, tasks: Array.from({ length: 20001 }, (_, i) => ({ id: i, title: 't' })) }]), /more than 20000 tasks/);
    const untitled = parseVikunjaExport([{ id: 1, title: 'P', tasks: [{ id: 1, title: '  ' }, { id: 2, title: 'ok', related_tasks: { blocking: [{ id: 99 }] } }] }]);
    assert.equal(untitled.tasks.length, 1);
    assert.ok(untitled.unsupported.some(u => /without a title/.test(u.reason)));
    assert.ok(planImportedLinks(untitled.tasks).unsupported.some(u => /not part of this import/.test(u.reason)),
      'a link to a task outside the export is reported, not guessed');
  });

  await test('negative: oversized uploads, inflating entries and too many files are refused', async () => {
    await assert.rejects(readVikunjaArchive(Buffer.alloc(MAX_VIKUNJA_ZIP_BYTES + 1)), /larger than/);
    await assert.rejects(readVikunjaImport({ zipBase64: 'A'.repeat(Math.ceil(MAX_VIKUNJA_ZIP_BYTES / 3) * 4 + 8) }), /larger than/);
    // 70 MB of zeros deflates to a few dozen KB: a small upload, a large inflate.
    const bomb = zip({ 'data.json': new Uint8Array(70 * 1024 * 1024), VERSION: 'v1.0.0' }, { level: 9 });
    assert.ok(bomb.length < 1024 * 1024, 'a small archive');
    await assert.rejects(readVikunjaArchive(bomb), /too large/);
    const many = { 'data.json': '[]', VERSION: 'v1.0.0' };
    for (let i = 0; i < 20001; i += 1) many[`files/${i}`] = 'x';
    await assert.rejects(readVikunjaArchive(zip(many, { level: 0 })), /more than 20000 files/);
    // The files themselves are counted, never inflated or written anywhere.
    const src = read('server/lib/vikunjaArchive.js');
    assert.match(src, /readZipEntryBounded\(entry, max, budget\)/);
    assert.doesNotMatch(src, /createWriteStream|writeFile|path\.join|entry\.buffer\(\)|entry\.vars/);
  });

  await test('export writes Vikunja\'s zip, and it imports back', async () => {
    const collected = {
      board: { _id: 'b1', title: 'Launch' },
      lists: [{ title: 'To do', wipLimit: { enabled: true, value: 4 } }, { title: 'Done' }],
      swimlanes: [{ title: 'Default' }],
      items: [
        { cardId: 'c1', title: 'Order valves', listTitle: 'To do', swimlaneTitle: 'Default', description: 'Two of them\nDN50',
          owner: 'alice', assignees: ['bob'], creator: 'carol', createdAt: '2026-10-01T00:00:00.000Z', startAt: '2026-10-02T00:00:00.000Z',
          dueAt: '2026-10-20T00:00:00.000Z', labels: ['Purchasing', 'Urgent'],
          customFields: { Priority: 'Urgent', 'Percent Done': 40 },
          checklists: [{ title: 'Checklist', items: [{ title: 'Quote', done: true }, { title: 'Order > 2 & more', done: false }] }],
          comments: [{ text: 'Call them', author: 'alice', date: '2026-10-03T00:00:00.000Z' }] },
        { cardId: 'c2', title: 'Ship it', listTitle: 'Done', swimlaneTitle: 'Default', endAt: '2026-10-07T00:00:00.000Z', parentCardId: 'c1' },
      ],
    };
    const built = formatters.vikunja(collected, new Date(Date.UTC(2026, 9, 8)));
    // The export boundary sees text, not HTML: nothing in it is markup to strip.
    // The stand-in strips to a fixed point (tests/tagStrippingFixedPoint.test.cjs).
    const stripTags = value => {
      let text = String(value);
      let prev;
      do {
        prev = text;
        text = text.replace(/<[^>]*>/g, '');
      } while (text !== prev);
      return text;
    };
    const bounded = sanitizeTransferValue(built, { direction: 'export', sanitizeHtml: stripTags });
    const files = vikunjaArchiveFiles(bounded.value);
    assert.deepEqual(Object.keys(files).sort(), ['VERSION', 'data.json', 'filters.json']);
    assert.equal(files.VERSION, 'v1.0.0', 'no trailing newline: Vikunja parses the file as it is');
    const data = JSON.parse(files['data.json']);
    assert.equal(data.length, 1);
    const [project] = data;
    assert.equal(project.title, 'Launch');
    assert.deepEqual(project.views.map(v => v.view_kind), ['list', 'gantt', 'table', 'kanban']);
    const kanban = project.views[3];
    assert.equal(kanban.bucket_configuration_mode, 'manual');
    assert.deepEqual(project.buckets.map(b => [b.title, b.project_view_id, b.limit]), [['To do', kanban.id, 4], ['Done', kanban.id, 0]]);
    assert.equal(kanban.default_bucket_id, project.buckets[0].id);
    assert.equal(kanban.done_bucket_id, project.buckets[1].id);
    const [valves, ship] = project.tasks;
    assert.equal(valves.priority, 4);
    assert.equal(valves.percent_done, 0.4);
    assert.equal(valves.done, false);
    assert.equal(valves.end_date, ZERO);
    assert.match(valves.description, /^<p>Two of them<br>DN50<\/p><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><p>Quote<\/p><\/li><li data-checked="false" data-type="taskItem"><p>Order &gt; 2 &amp; more<\/p><\/li><\/ul>$/);
    assert.equal(valves.comments[0].comment, '<p>Call them</p>');
    assert.deepEqual(valves.related_tasks, { subtask: [{ id: ship.id }] });
    assert.equal(ship.done, true, 'a card in the done bucket is done');
    assert.equal(ship.done_at, '2026-10-07T00:00:00.000Z');
    assert.deepEqual(ship.related_tasks, { parenttask: [{ id: valves.id }] }, 'ids only: Vikunja never duplicates a linked task');
    assert.deepEqual(project.task_buckets.map(tb => tb.bucket_id), [project.buckets[0].id, project.buckets[1].id]);
    assert.equal(project.positions.length, 2);

    const back = await importZip(writeVikunjaArchive(files).toString('base64'));
    assert.equal(back.board.name, 'Launch');
    assert.deepEqual(back.columns.map(c => c.title), ['To do', 'Done']);
    const [first, second] = back.tasks;
    assert.equal(first.title, 'Order valves');
    assert.equal(first.description, 'Two of them\nDN50');
    assert.deepEqual(first.checklists, collected.items[0].checklists);
    assert.equal(first.owner_username, 'alice');
    assert.deepEqual(first.assignees, ['bob']);
    assert.equal(first.requested_by, 'carol');
    assert.equal(first.date_due, '2026-10-20T00:00:00.000Z');
    assert.equal(first.date_started, '2026-10-02T00:00:00.000Z');
    assert.equal(first.date_creation, '2026-10-01T00:00:00.000Z');
    assert.deepEqual(first.tags, ['Purchasing', 'Urgent']);
    assert.deepEqual(first.custom_fields, { Priority: 'Urgent', 'Percent Done': 40 });
    assert.deepEqual(first.comments, [{ text: 'Call them', author: 'alice', date: '2026-10-03T00:00:00.000Z' }]);
    assert.equal(second.column_name, 'Done');
    assert.equal(second.date_end, '2026-10-07T00:00:00.000Z');
    assert.deepEqual(second.custom_fields, { Done: true });
    assert.equal(second.parent_ref, first.ref);
    assert.ok(back.unsupported.some(u => /limit of 4/.test(u.reason)), 'the WIP limit went out, and is said on the way in');
  });

  await test('export: several swimlanes become child projects of the board\'s project, and come back as swimlanes', async () => {
    const built = formatVikunja({
      board: { title: 'Ops' }, lists: [{ title: 'Doing' }], swimlanes: [{ title: 'Web' }, { title: 'Mail' }],
      items: [{ cardId: 'a', title: 'Cert', listTitle: 'Doing', swimlaneTitle: 'Mail' }],
    });
    assert.deepEqual(built.projects.map(p => [p.title, p.parent_project_id]), [['Ops', 0], ['Web', 1], ['Mail', 1]]);
    const back = parseVikunjaExport({ version: built.version, data: vikunjaArchiveFiles(built)['data.json'] });
    assert.equal(back.board.name, 'Ops');
    assert.deepEqual(back.swimlanes.map(s => s.name), ['Web', 'Mail'], 'the swimlane without cards too');
    assert.deepEqual(back.tasks.map(t => `${t.title}/${t.swimlane_name}/${t.column_name}`), ['Cert/Mail/Doing']);
    // Projects with tasks under different parents are all imported, under a neutral board name.
    const other = { id: 99, title: 'Elsewhere', parent_project_id: 0, tasks: [{ id: 999, title: 'x' }] };
    const mixed = parseVikunjaExport([...JSON.parse(vikunjaArchiveFiles(built)['data.json']), other]);
    assert.equal(mixed.board.name, 'Imported Vikunja', 'two parents: no common name');
    assert.equal(mixed.tasks.length, 2);
  });

  await test('the format is wired into import, export, the import page and the export menu', async () => {
    assert.equal(EXTERNAL_PARSERS.vikunja, parseVikunjaExport);
    assert.equal(typeof formatters.vikunja, 'function');
    const imp = read('models/import.js');
    // Later formats parsed before sanitizing (Plane) follow in the same condition.
    assert.match(imp, /importSource === 'opml' \|\| importSource === 'vikunja'(?: \|\| importSource === '[a-z]+')* \? board/);
    assert.match(imp, /case 'vikunja':[\s\S]*?check\(board, Match\.OneOf\(Object, String\)\);[\s\S]*?readVikunjaImport\(importedBoard\);\s*importedBoard = EXTERNAL_PARSERS\.vikunja\(importedBoard\);[\s\S]*?sanitizeImported\(importedBoard, 'vikunja', this\);\s*creator = new KanboardCreator\(data, 'vikunja'\);/);
    // The bytes of each format are made in server/lib/renderExternalExport.js,
    // shared by the board export route and "Export all boards".
    const exp = read('server/lib/renderExternalExport.js');
    assert.match(exp, /if \(format === 'vikunja'\) \{[\s\S]*?contentType: 'application\/zip', body: require\('\/server\/lib\/vikunjaArchive'\)\.writeVikunjaArchive\(vikunjaArchiveFiles\(built\)\)/);
    const page = read('client/components/import/import.js');
    assert.match(read('models/lib/importSources.js'), /\{ key: 'vikunja', name: 'Vikunja'[,}]/); // the one list of sources
    // The page reads every source through one path described in
    // models/lib/importSources.js, not a branch of its own.
    assert.match(read('models/lib/importSources.js'), /\{ key: 'vikunja', name: '[^']+', \.\.\.TEXT, files: \[[^\]]*'\.zip'[^\]]*\], zipSend: 'zip' \}/, 'one export .zip, read by the one import path');
    assert.match(read('client/components/import/import.jade'), /input\.js-import-file\(id='import-file' type="file" accept="\{\{importAccept\}\}"\)/, 'the one file chooser');
    assert.match(read('client/components/boards/exportScope.js'),
      /\{ key: 'vikunja', icon: 'fa-file-archive-o', label: 'Vikunja', path: 'export\/vikunja', ext: 'zip', scopes: BOARD_ONLY \}/);
  });

  console.log(`\nvikunjaFormat: ${passed} checks passed`);
}

main().catch(error => { console.error(error); process.exit(1); });
