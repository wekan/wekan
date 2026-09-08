'use strict';

// GitHub/Gitea/Forgejo issue import (models/lib/externalParsers.js).
// Run: node tests/githubImport.test.cjs
//
// The parser normalizes a GitHub Issues REST API v3 page (or several pages
// concatenated - completing pagination is the API client's job, not this
// parser's) into the Kanboard shape KanboardCreator consumes. Fields with no
// place in that shape (a second assignee, a state reason, an issue number)
// used to be silently dropped; this pins that they now survive either as a
// tag or as an entry in the `unsupported` loss report, per
// docs/Features/ImportExport/Format-Coverage.md's `{ normalized, warnings,
// unsupported }` contract.

const assert = require('assert');

async function main() {
  const { parseGithub, parseGitea } = await import('../models/lib/externalParsers.js');

  const issues = [
    {
      number: 42,
      title: 'Bug: crash on save',
      body: 'Steps to repro...',
      state: 'open',
      labels: [{ name: 'bug' }],
      assignee: { login: 'alice' },
      assignees: [{ login: 'alice' }, { login: 'bob' }],
      user: { login: 'carol' },
      milestone: { title: 'v2.0', due_on: '2026-10-01' },
      comments: 3,
      html_url: 'https://github.com/o/r/issues/42',
    },
    { number: 43, title: 'A pull request, not an issue', pull_request: {}, state: 'open' },
    {
      number: 44,
      title: 'Closed with a reason',
      state: 'closed',
      state_reason: 'not_planned',
      comments_data: [{ user: { login: 'dave' }, body: 'wontfix' }],
    },
  ];

  let passed = 0;
  function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

  console.log('githubImport:');

  const out = parseGithub(issues);

  test('pull requests are filtered out of the issue list', () => {
    assert.strictEqual(out.tasks.length, 2);
    assert.ok(out.tasks.every(t => t.title !== 'A pull request, not an issue'));
  });

  test('open/closed state becomes the column', () => {
    assert.strictEqual(out.tasks[0].column_name, 'Open');
    assert.strictEqual(out.tasks[1].column_name, 'Closed');
  });

  test('the issue author is Requested By, the assignee is the Owner', () => {
    assert.strictEqual(out.tasks[0].requested_by, 'carol');
    assert.strictEqual(out.tasks[0].owner_username, 'alice');
  });

  test('a milestone title is kept as a tag, not just its due date', () => {
    assert.strictEqual(out.tasks[0].date_due, '2026-10-01');
    assert.ok(out.tasks[0].tags.includes('milestone:v2.0'));
  });

  test('a second assignee is kept as a tag and reported as unsupported', () => {
    assert.ok(out.tasks[0].tags.includes('assignee:bob'));
    assert.ok(out.unsupported.some(u => u.path === '/0/assignees'));
  });

  test('the source issue number and URL are appended to the description', () => {
    assert.match(out.tasks[0].description, /Source: #42 https:\/\/github\.com\/o\/r\/issues\/42/);
  });

  test('comments not embedded in the export are reported, not silently dropped', () => {
    assert.ok(out.unsupported.some(u => u.path === '/0/comments' && /3 comment/.test(u.reason)));
  });

  test('comments that ARE embedded are rendered into the description', () => {
    assert.match(out.tasks[1].description, /Comments:\n- dave: wontfix/);
  });

  test('a non-"completed" state reason is kept as a tag', () => {
    assert.ok(out.tasks[1].tags.includes('state_reason:not_planned'));
  });

  test('several pages concatenated into one array are all imported', () => {
    const page1 = [{ number: 1, title: 'first', state: 'open' }];
    const page2 = [{ number: 2, title: 'second', state: 'open' }];
    const merged = parseGithub([...page1, ...page2]);
    assert.strictEqual(merged.tasks.length, 2);
  });

  test('Gitea/Forgejo share the same parser and the same loss reporting', () => {
    const geteaOut = parseGitea(issues);
    assert.deepStrictEqual(geteaOut.tasks.map(t => t.title), out.tasks.map(t => t.title));
    assert.strictEqual(geteaOut.board.name, 'Imported Gitea/Forgejo issues');
    assert.ok(geteaOut.unsupported.length > 0);
  });

  console.log(`\ngithubImport: ${passed} tests passed`);
}

main().catch(e => { console.error(e); process.exit(1); });
