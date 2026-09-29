'use strict';

// GitLab issue import and Sync source (models/lib/externalParsers.js), #2698.
// Run: node tests/gitlabImport.test.cjs
//
// parseGitlab used to keep only title, description, state, due date, the
// first assignee, author and labels, and silently dropped the rest of an
// Issues API v4 issue. It now meets docs/Features/ImportExport/Format-
// Coverage.md like the GitHub adapter: every field either lands on the card,
// becomes a tag or custom field, or is named in the `unsupported` report.

const assert = require('assert');

async function main() {
  const { parseGitlab } = await import('../models/lib/externalParsers.js');
  const plan = await import('../models/lib/importedTaskPlan.js');
  let passed = 0;
  const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

  const issues = [
    {
      id: 901, iid: 7, title: 'Crash on save', description: 'Steps', state: 'opened',
      labels: [{ name: 'bug', color: '#ff0000' }, 'backend'],
      assignee: { username: 'alice' }, assignees: [{ username: 'alice' }, { username: 'bob' }],
      author: { username: 'carol', name: 'Carol' },
      milestone: { title: 'v2.0', due_date: '2026-10-01' }, iteration: { title: 'Sprint 4' },
      weight: 3, confidential: true, issue_type: 'incident',
      time_stats: { time_estimate: 7200, total_time_spent: 5400 },
      task_completion_status: { count: 4, completed_count: 1 },
      created_at: '2026-01-02T03:04:05Z',
      references: { full: 'group/project#7' }, web_url: 'https://gitlab.example/group/project/-/issues/7',
      notes: [
        { body: 'I can reproduce', author: { username: 'dave', name: 'Dave' }, created_at: '2026-01-03T00:00:00Z' },
        { body: 'added ~bug label', system: true, author: { username: 'gitlab' } },
      ],
      links: [{ iid: 8, link_type: 'blocks' }, { iid: 99, link_type: 'relates_to' }],
      epic: { id: 1 },
    },
    { id: 902, iid: 8, title: 'Closed one', state: 'closed', closed_at: '2026-02-01T00:00:00Z', user_notes_count: 2 },
  ];
  const result = parseGitlab(issues);
  const [open, closed] = result.tasks;

  test('title, state, iid key and the source link', () => {
    assert.equal(open.externalId, '7');
    assert.equal(open.ref, '7');
    assert.equal(open.column_name, 'Open');
    assert.equal(closed.column_name, 'Closed');
    assert.match(open.description, /^Steps\n\nSource: group\/project#7 https:\/\/gitlab\.example\/group\/project\/-\/issues\/7$/);
  });

  test('every assignee, the author and the dates', () => {
    assert.equal(open.owner_username, 'alice');
    assert.deepEqual(open.assignees, ['bob'], 'the second assignee is no longer only a tag');
    assert.equal(open.requested_by, 'carol');
    assert.equal(open.date_due, '2026-10-01');
    assert.equal(open.date_creation, '2026-01-02T03:04:05Z');
    assert.equal(open.date_end, undefined, 'an open issue has no end');
    assert.equal(closed.date_end, '2026-02-01T00:00:00Z');
  });

  test('labels with details, milestone, iteration, type and confidentiality become tags', () => {
    assert.deepEqual(open.tags, ['bug', 'backend', 'milestone:v2.0', 'iteration:Sprint 4', 'type:incident', 'confidential']);
    assert.ok(result.warnings.some(w => /confidential/.test(w)), 'confidential content is warned about');
  });

  test('time, weight and task completion', () => {
    assert.equal(open.spent_hours, 1.5);
    assert.deepEqual(open.custom_fields, { Weight: 3, 'Time estimate (hours)': 2, Tasks: '1/4' });
  });

  test('comments exclude system notes; links become dependencies', () => {
    assert.deepEqual(open.comments, [{ text: 'I can reproduce', author: 'dave', authorName: 'Dave', date: '2026-01-03T00:00:00Z' }]);
    assert.deepEqual(open.dependencies, [{ ref: '8', type: 'blocks' }, { ref: '99', type: 'related-to' }]);
  });

  test('what has no place is reported, not dropped (negative)', () => {
    assert.ok(result.unsupported.some(u => u.path === '/0/epic'));
    assert.ok(result.unsupported.some(u => u.path === '/1/user_notes_count' && /2 comment/.test(u.reason)),
      'comments that exist upstream but were not exported are reported');
    assert.ok(!result.unsupported.some(u => u.path === '/0/user_notes_count'), 'embedded notes are not reported missing');
  });

  test('the planner puts them on the card, and a link outside the import is reported', () => {
    const planned = plan.planImportedTask(open, { members: { alice: 'u-alice', bob: 'u-bob' } });
    assert.deepEqual(planned.memberIds, ['u-alice', 'u-bob']);
    assert.equal(planned.card.spentTime, 1.5);
    assert.equal(planned.card.createdAt.toISOString(), '2026-01-02T03:04:05.000Z');
    assert.equal(planned.comments.length, 1);
    const links = plan.planImportedLinks(result.tasks);
    assert.deepEqual(links.dependencies, [{ index: 0, deps: [{ target: 1, type: 'blocks' }] }]);
    assert.ok(links.unsupported.some(u => /not part of this import/.test(u.reason)), '#99 is reported');
    const fields = plan.planImportedCustomFields(result.tasks);
    assert.ok(fields.fields.some(f => f.name === 'Weight'));
  });

  test('a minimal or legacy issue still imports', () => {
    const minimal = parseGitlab({ issues: [{ id: 5, title: 'Only an id', state: 'opened', labels: ['x'] }] });
    assert.equal(minimal.tasks[0].externalId, '5');
    assert.equal(minimal.tasks[0].description, '');
    assert.deepEqual(minimal.tasks[0].tags, ['x']);
    assert.deepEqual(minimal.unsupported, []);
    assert.equal(parseGitlab([]).tasks.length, 0);
  });

  console.log(`\ngitlabImport: ${passed} tests passed`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
