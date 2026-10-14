'use strict';

// Guard: list sync's "Comments, labels, state and files" - a list synced from
// GitHub, GitLab, Gitea or Forgejo brings each issue's conversation, labels,
// open/closed state and files, so the board is that repository's issue
// tracker in Board View / Version Control.
// Run: node tests/listSyncIssueDetails.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const d = require('../models/lib/listSyncIssueDetails.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const labelIdByName = new Map([['bug', 'L-bug'], ['ui', 'L-ui'], ['milestone:v1', 'L-m1']]);

test('labels: the issue\'s own, milestones included, parser-only tags left out', () => {
  assert.deepStrictEqual(d.issueLabelNames({ tags: ['bug', 'assignee:bob', 'state_reason:not_planned', 'type:incident', 'milestone:v1', 'bug', { name: 'ui' }] }),
    ['bug', 'milestone:v1', 'ui']);
  assert.strictEqual(d.labelColor('bug'), d.labelColor('bug'));
});

test('labels: sync replaces only what it added; labels added in WeKan stay', () => {
  const card = { labelIds: ['L-local', 'L-ui'], syncLabelIds: ['L-ui'], syncIssueState: 'open' };
  const plan = d.planIssueDetails({ card, task: { tags: ['bug'], column_name: 'Open' }, labelIdByName });
  assert.deepStrictEqual(plan.set, { labelIds: ['L-local', 'L-bug'], syncLabelIds: ['L-bug'] });
  // negative: nothing changed upstream - nothing is written
  const same = d.planIssueDetails({ card: { labelIds: ['L-local', 'L-bug'], syncLabelIds: ['L-bug'], syncIssueState: 'open' },
    task: { tags: ['bug'], column_name: 'Open' }, labelIdByName });
  assert.deepStrictEqual(same.set, {});
});

test('state follows the tracker', () => {
  const plan = d.planIssueDetails({ card: { syncIssueState: 'open' }, task: { column_name: 'Closed' }, labelIdByName });
  assert.strictEqual(plan.set.syncIssueState, 'closed');
});

test('comments: new ones added, edited ones updated, by the tracker\'s comment id', () => {
  const plan = d.planIssueDetails({
    card: { syncIssueState: 'open' },
    task: { column_name: 'Open', comments: [
      { externalId: '1', author: 'alice', text: 'first' },
      { externalId: '2', author: 'bob', text: 'edited upstream' },
      { externalId: '3', author: 'carol', text: 'same' },
      { author: 'nobody', text: 'no id: an import-only comment, never synced' },
    ] },
    labelIdByName,
    comments: [{ _id: 'c2', syncCommentId: '2', text: 'bob: before' }, { _id: 'c3', syncCommentId: '3', text: 'carol: same' }],
  });
  assert.deepStrictEqual(plan.insertComments.map(c => [c.syncCommentId, c.text]), [['1', 'alice: first']]);
  assert.deepStrictEqual(plan.updateComments, [{ _id: 'c2', text: 'bob: edited upstream' }]);
});

test('files: each url once', () => {
  const plan = d.planIssueDetails({ card: {}, task: { attachments: [{ name: 'a', url: 'https://x/a' }, { name: 'b', url: 'https://x/b' }] },
    labelIdByName, fileUrls: new Set(['https://x/a']) });
  assert.deepStrictEqual(plan.files.map(f => f.name), ['b']);
});

test('repository-wide comments go to their issue by issue_url', () => {
  const issues = d.attachRepositoryComments([{ number: 1 }, { number: 2 }, { id: 'x' }], [
    { id: 10, issue_url: 'https://api.github.com/repos/o/r/issues/2', body: 'hi' },
    { id: 11, issue_url: 'https://gitea.example/api/v1/repos/o/r/issues/1', body: 'yo' },
    { id: 12, issue_url: 'https://api.github.com/repos/o/r/pulls/3', body: 'not an issue' },
  ]);
  assert.deepStrictEqual(issues.map(i => (i.comments_data || []).map(c => c.id)), [[11], [10], []]);
});

test('rate limits: GitHub reset, Retry-After, 429; negative: a plain 403 is not one', () => {
  const now = 1_700_000_000_000;
  const h = o => new Headers(o);
  assert.strictEqual(d.rateLimitWait(403, h({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(now / 1000 + 30) }), now), 30000);
  assert.strictEqual(d.rateLimitWait(403, h({ 'retry-after': '60' }), now), 60000);
  assert.strictEqual(d.rateLimitWait(429, h({ 'ratelimit-reset': '5' }), now), 5000);
  assert.strictEqual(d.rateLimitWait(429, h({}), now), 60000);
  assert.strictEqual(d.rateLimitWait(403, h({ 'x-ratelimit-remaining': '12' }), now), null);
  assert.strictEqual(d.rateLimitWait(500, h({ 'retry-after': '1' }), now), null);
});

const fetch = read('server/lib/listSyncFetch.js');
const sync = read('server/listSync.js');
const apply = read('server/lib/listSyncIssueDetails.js');
const method = read('server/methods/listSync.js');

test('fetch: comments only when asked, Gitea without pull requests, rate limit waited once', () => {
  assert.match(fetch, /if \(!syncSource\.issueDetails\) return issues;[\s\S]*?\/issues\/comments\?per_page=100/);
  assert.match(fetch, /issues\?state=all&type=issues&limit=100/);
  assert.match(fetch, /\/issues\/\$\{Number\(issue\.iid\)\}\/notes\?per_page=100&sort=asc/);
  assert.match(fetch, /if \(!retried && wait <= RATE_LIMIT_WAIT_MS\)/);
});

test('apply: after a successful run only, never fatal, through hooked collections', () => {
  assert.strictEqual((sync.match(/return withIssueDetails\(\{/g) || []).length, 2, 'both success paths');
  assert.match(sync, /if \(!source\.issueDetails\) return result;/);
  assert.doesNotMatch(apply, /\.direct\./, 'history and undo see every write');
  assert.match(apply, /fetchImportedAttachment\(file\.url\)/);
  assert.match(apply, /Attachments\.writeAsync\(downloaded\.buffer, \{[\s\S]*?syncUrl: file\.url[\s\S]*?\}, true\)/);
});

test('opt-in: off unless chosen, and only for issue trackers', () => {
  assert.match(method, /issueDetails: Match\.Optional\(Boolean\)/);
  assert.match(method, /config\.issueDetails === true && ISSUE_DETAIL_SOURCES\.includes\(source\.type\)/);
  assert.deepStrictEqual(d.ISSUE_DETAIL_SOURCES, ['github', 'gitlab', 'gitea', 'forgejo']);
});

test('a synced issue is not closed from WeKan (the sync would see it gone)', () => {
  assert.match(read('server/versionControlView.js'), /if \(isSyncedIssue\(card\)\) throw new Meteor\.Error\('vcs-synced-issue'\)/);
  const vcs = require('../models/lib/versionControlView.js');
  assert.strictEqual(vcs.issueState({ syncIssueState: 'closed' }, 'Open'), 'closed');
  assert.strictEqual(vcs.issueState({ syncIssueState: 'open' }, 'Closed'), 'open');
});

console.log(`# ${passed} passed`);
