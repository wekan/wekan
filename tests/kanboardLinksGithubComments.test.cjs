'use strict';

// Kanboard task links and GitHub/Gitea/Forgejo embedded comments.
// Run: node tests/kanboardLinksGithubComments.test.cjs
//
// parseKanboard (models/lib/externalParsers.js) used to report every Kanboard
// task link as a loss. Kanboard keeps each link twice - once from each task,
// the second with the opposite label (TaskLinkModel::create) - and
// getAllTaskLinks lists the OTHER task as `task_id`. The links now become a
// parent card ("is a child of" / "is a parent of") or one WeKan dependency
// per link, and the Kanboard export writes them back in the same shape.
//
// The GitHub issue parser (shared with Gitea and Forgejo) used to append
// embedded comments to the card description; each one is now a card comment
// with its author and date.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

async function main() {
  const { parseKanboard, parseGithub, parseGitea, EXTERNAL_PARSERS } = await import('../models/lib/externalParsers.js');
  const { planImportedLinks, planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const { formatters } = await import('../models/lib/externalExportFormatters.js');

  const byTitle = (parsed, title) => parsed.tasks.find(t => t.title === title);
  const kb = tasks => parseKanboard({ columns: [{ id: 1, title: 'Todo' }], tasks });

  console.log('kanboardLinksGithubComments:');

  // --- Kanboard links ---------------------------------------------------------
  await test('"is a child of" sets this task\'s parent; the "is a parent of" row is the same link', async () => {
    const parsed = kb([
      { id: '10', title: 'Epic', links: [{ id: '2', task_id: '11', label: 'is a parent of' }] },
      { id: '11', title: 'Story', links: [{ id: '1', task_id: '10', label: 'is a child of' }] },
    ]);
    assert.equal(byTitle(parsed, 'Story').parent_ref, '10');
    assert.equal(byTitle(parsed, 'Epic').parent_ref, undefined);
    assert.equal(byTitle(parsed, 'Epic').dependencies, undefined, 'a parent link is not also a dependency');
    assert.deepEqual(parsed.unsupported, []);
    const plan = planImportedLinks(parsed.tasks);
    assert.deepEqual(plan.parents, [{ index: 1, parent: 0 }]);
    assert.deepEqual(plan.dependencies, []);
  });

  await test('"is a parent of" alone sets the OTHER task\'s parent', async () => {
    const parsed = kb([
      { id: 1, title: 'Epic', links: [{ task_id: 2, label: 'is a parent of' }] },
      { id: 2, title: 'Story' },
    ]);
    assert.equal(byTitle(parsed, 'Story').parent_ref, '1');
    assert.deepEqual(planImportedLinks(parsed.tasks).parents, [{ index: 1, parent: 0 }]);
  });

  await test('blocks and is blocked by: the two rows become ONE dependency', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: [{ id: 5, task_id: 2, label: 'blocks' }] },
      { id: 2, title: 'B', links: [{ id: 6, task_id: 1, label: 'is blocked by' }] },
    ]);
    assert.deepEqual(byTitle(parsed, 'A').dependencies, [{ ref: '2', type: 'blocks' }]);
    assert.equal(byTitle(parsed, 'B').dependencies, undefined);
    assert.deepEqual(planImportedLinks(parsed.tasks).dependencies, [{ index: 0, deps: [{ target: 1, type: 'blocks' }] }]);
  });

  await test('"is blocked by" listed first keeps its direction', async () => {
    const parsed = kb([
      { id: 2, title: 'B', links: [{ task_id: 1, label: 'is blocked by' }] },
      { id: 1, title: 'A', links: [{ task_id: 2, label: 'blocks' }] },
    ]);
    assert.deepEqual(byTitle(parsed, 'B').dependencies, [{ ref: '1', type: 'is-blocked-by' }]);
    assert.equal(byTitle(parsed, 'A').dependencies, undefined);
  });

  await test('duplicates, fixes and relates to map onto WeKan dependency types', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: [
        { task_id: 2, label: 'duplicates' }, { task_id: 3, label: 'is fixed by' }, { task_id: 4, label: 'Relates to' }] },
      { id: 2, title: 'B', links: [{ task_id: 1, label: 'is duplicated by' }] },
      { id: 3, title: 'C', links: [{ task_id: 1, label: 'fixes' }] },
      { id: 4, title: 'D', links: [{ task_id: 1, label: 'relates to' }] },
    ]);
    assert.deepEqual(byTitle(parsed, 'A').dependencies, [
      { ref: '2', type: 'duplicates' }, { ref: '3', type: 'is-fixed-by' }, { ref: '4', type: 'related-to' }]);
    for (const t of ['B', 'C', 'D']) assert.equal(byTitle(parsed, t).dependencies, undefined, t);
    assert.deepEqual(parsed.unsupported, []);
  });

  await test('getTaskLinkById rows (link_id, opposite_task_id) are read too', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: [{ id: 9, link_id: 6, task_id: 1, opposite_task_id: 2 }] },
      { id: 2, title: 'B', links: [{ id: 10, link_id: '3', task_id: 2, opposite_task_id: 1 }] },
      { id: 3, title: 'C', links: [{ link_id: 2, task_id: 3, opposite_task_id: 2 }] },
    ]);
    assert.equal(byTitle(parsed, 'A').parent_ref, '2');
    // B is blocked by A (link 3) and C blocks B (link 2): two different links.
    assert.deepEqual(byTitle(parsed, 'B').dependencies, [{ ref: '1', type: 'is-blocked-by' }]);
    assert.deepEqual(byTitle(parsed, 'C').dependencies, [{ ref: '2', type: 'blocks' }]);
  });

  await test('links grouped by label ({ label: [rows] }) are read', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: { blocks: [{ task_id: 2 }] } },
      { id: 2, title: 'B' },
    ]);
    assert.deepEqual(byTitle(parsed, 'A').dependencies, [{ ref: '2', type: 'blocks' }]);
  });

  await test('milestone links are imported as related to, and reported', async () => {
    const parsed = kb([
      { id: 1, title: 'Task', links: [{ task_id: 2, label: 'targets milestone' }] },
      { id: 2, title: 'Milestone', links: [{ task_id: 1, label: 'is a milestone of' }] },
    ]);
    assert.deepEqual(byTitle(parsed, 'Task').dependencies, [{ ref: '2', type: 'related-to' }]);
    assert.equal(byTitle(parsed, 'Milestone').dependencies, undefined);
    assert.equal(parsed.unsupported.length, 1, 'the pair is reported once');
    assert.match(parsed.unsupported[0].reason, /targets milestone.*related to/);
  });

  await test('negative: an unknown link label is reported, not guessed', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: [{ task_id: 2, label: 'is the cousin of' }, { task_id: 2, link_id: 99 }, 'junk'] },
      { id: 2, title: 'B' },
    ]);
    assert.equal(byTitle(parsed, 'A').dependencies, undefined);
    assert.equal(byTitle(parsed, 'A').parent_ref, undefined);
    assert.deepEqual(parsed.unsupported.map(u => u.path), ['/tasks/0/links/0', '/tasks/0/links/1', '/tasks/0/links/2']);
    assert.match(parsed.unsupported[0].reason, /"is the cousin of" has no WeKan equivalent/);
    assert.match(parsed.unsupported[2].reason, /not a task link/);
  });

  await test('negative: a link to a task outside the import is reported, not emitted', async () => {
    const parsed = kb([
      { id: 1, title: 'A', links: [{ task_id: 77, label: 'blocks' }, { task_id: 78, label: 'is a parent of' }, { label: 'blocks' }] },
    ]);
    assert.equal(parsed.tasks[0].dependencies, undefined);
    assert.equal(parsed.tasks[0].parent_ref, undefined);
    assert.deepEqual(parsed.unsupported.map(u => u.reason), [
      'linked task #77 is not part of this import',
      'linked task #78 is not part of this import',
      'linked task is not part of this import',
    ]);
  });

  await test('negative: a second parent and a second link to the same task are reported', async () => {
    const parsed = kb([
      { id: 1, title: 'Child', links: [{ task_id: 2, label: 'is a child of' }, { task_id: 3, label: 'is a child of' }] },
      { id: 2, title: 'P1', links: [{ task_id: 3, label: 'blocks' }, { task_id: 3, label: 'duplicates' }] },
      { id: 3, title: 'P2' },
    ]);
    assert.equal(byTitle(parsed, 'Child').parent_ref, '2');
    assert.deepEqual(byTitle(parsed, 'P1').dependencies, [{ ref: '3', type: 'blocks' }]);
    assert.deepEqual(parsed.unsupported.map(u => u.path), ['/tasks/0/links/1', '/tasks/1/links/1']);
  });

  await test('negative: a self link and a task without links add nothing', async () => {
    const parsed = kb([{ id: 1, title: 'A', links: [{ task_id: 1, label: 'blocks' }] }, { title: 'No id' }]);
    assert.equal(parsed.tasks[0].dependencies, undefined);
    assert.equal(parsed.tasks[1].ref, undefined);
    assert.deepEqual(parsed.unsupported, []);
  });

  await test('the Kanboard export writes parents and dependencies as task links that import back', async () => {
    const collected = {
      board: { title: 'Linked' },
      lists: [{ _id: 'L1', title: 'Todo' }],
      swimlanes: [{ _id: 'S1', title: 'Default' }],
      items: [
        { cardId: 'P', title: 'Parent', description: '', listTitle: 'Todo', swimlaneTitle: 'Default', labels: [],
          dependencies: [{ cardId: 'C', type: 'blocks' }, { cardId: 'gone', type: 'fixes' }] },
        { cardId: 'C', title: 'Child', description: '', listTitle: 'Todo', swimlaneTitle: 'Default', labels: [],
          parentCardId: 'P', dependencies: [{ cardId: 'X', type: 'is-duplicated-by' }] },
        { cardId: 'X', title: 'Other', description: '', listTitle: 'Todo', swimlaneTitle: 'Default', labels: [],
          dependencies: [{ cardId: 'C', type: 'duplicates' }] },
      ],
    };
    const exported = formatters.kanboard(collected);
    assert.deepEqual(exported.tasks.map(t => t.id), [1, 2, 3]);
    assert.deepEqual(exported.tasks[0].links.map(l => [l.task_id, l.label]), [[2, 'blocks'], [2, 'is a parent of']]);
    assert.deepEqual(exported.tasks[1].links.map(l => [l.task_id, l.label]),
      [[1, 'is blocked by'], [1, 'is a child of'], [3, 'is duplicated by']]);
    assert.deepEqual(exported.tasks[2].links.map(l => [l.task_id, l.label]), [[2, 'duplicates']],
      'the same link stored on both cards is written once from each end');
    const ids = exported.tasks.flatMap(t => t.links.map(l => l.id));
    assert.equal(new Set(ids).size, ids.length, 'link ids are unique');
    const parsed = parseKanboard(JSON.parse(JSON.stringify(exported)));
    assert.deepEqual(parsed.unsupported, []);
    const plan = planImportedLinks(parsed.tasks);
    assert.deepEqual(plan.parents, [{ index: 1, parent: 0 }]);
    assert.deepEqual(plan.dependencies, [
      { index: 0, deps: [{ target: 1, type: 'blocks' }] },
      { index: 1, deps: [{ target: 2, type: 'is-duplicated-by' }] },
    ]);
    assert.deepEqual(plan.unsupported, []);
    // Without parents or dependencies a task carries no links key.
    const plain = formatters.kanboard({ ...collected, items: [{ ...collected.items[2], dependencies: [] }] });
    assert.equal(plain.tasks[0].links, undefined);
  });

  await test('the shipped Kanboard fixture still parses with its dangling link reported', async () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/kanboard.json')));
    const parsed = parseKanboard(fixture);
    assert.ok(parsed.unsupported.some(u => u.path === '/tasks/0/links/0'));
  });

  // --- GitHub / Gitea / Forgejo comments ------------------------------------
  await test('GitHub REST comments become card comments with author and date', async () => {
    const parsed = parseGithub([{
      number: 7, title: 'Issue', body: 'Original body', state: 'open', comments: 2,
      comments_data: [
        { id: 1, body: 'First reply', user: { login: 'alice' }, created_at: '2026-09-01T10:00:00Z' },
        { id: 2, body: '  Second  ', user: { login: 'bob' }, created_at: '2026-09-02T10:00:00Z' },
      ],
    }]);
    const [task] = parsed.tasks;
    assert.deepEqual(task.comments, [
      { text: 'First reply', author: 'alice', date: '2026-09-01T10:00:00Z' },
      { text: 'Second', author: 'bob', date: '2026-09-02T10:00:00Z' },
    ]);
    assert.equal(task.description, 'Original body\n\nSource: #7', 'the description is not changed by comments');
    assert.deepEqual(parsed.unsupported, [], 'all counted comments are embedded');
    const plan = planImportedTask(task, { members: { alice: 'uA' } });
    assert.deepEqual(plan.comments.map(c => [c.text, c.userId]), [['First reply', 'uA'], ['bob: Second', null]]);
    assert.equal(plan.comments[0].createdAt.toISOString(), '2026-09-01T10:00:00.000Z');
  });

  await test('Gitea and Forgejo comments (user.username, comments as an array) are read', async () => {
    const issue = { number: 3, title: 'G', state: 'open', comments: [
      { body: 'From gitea', user: { username: 'gitea-user' }, created_at: '2026-09-03T00:00:00Z' }] };
    assert.equal(EXTERNAL_PARSERS.forgejo, parseGitea);
    const parsed = parseGitea([issue]);
    assert.deepEqual(parsed.tasks[0].comments, [{ text: 'From gitea', author: 'gitea-user', date: '2026-09-03T00:00:00Z' }]);
    assert.deepEqual(parsed.unsupported, []);
  });

  await test('negative: malformed embedded comments are reported, not imported', async () => {
    const parsed = parseGithub([{
      number: 9, title: 'Bad', state: 'open', body: 'Body',
      comments_data: [null, 'text', { body: '' }, { body: 42 }, { body: 'kept' }],
    }]);
    assert.deepEqual(parsed.tasks[0].comments, [{ text: 'kept' }]);
    assert.deepEqual(parsed.unsupported.map(u => u.path),
      ['/0/comments_data/0', '/0/comments_data/1', '/0/comments_data/2', '/0/comments_data/3']);
    assert.equal(parsed.tasks[0].description, 'Body\n\nSource: #9');
    assert.doesNotMatch(parsed.tasks[0].description, /Comments:/);
  });

  await test('negative: no comments key, or a count only, adds no comments', async () => {
    const parsed = parseGithub([{ number: 1, title: 'A', state: 'open' }, { number: 2, title: 'B', state: 'open', comments: 4,
      comments_data: [{ body: 'one', user: { login: 'x' } }] }]);
    assert.equal(parsed.tasks[0].comments, undefined);
    assert.equal(parsed.tasks[1].comments.length, 1);
    assert.deepEqual(parsed.unsupported.map(u => [u.path, u.reason]),
      [['/1/comments', '3 comment(s) exist upstream but were not embedded in this export']]);
  });

  console.log(`\nkanboardLinksGithubComments: ${passed} tests passed`);
}

main().catch(e => { console.error(e); process.exit(1); });
