'use strict';

// Guard: the optional Trello-, Jira-, GitHub- and Gitea-compatible APIs
// (models/lib/optionalApis.js, server/compatApi/) - off until an
// administrator ticks them, and with no rights of their own: every one is a
// translator in front of WeKan's REST API, called as the caller.
// Run: node tests/optionalApis.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const o = require('../models/lib/optionalApis.js');
const t = require('../models/lib/trelloCompatApi.js');
const j = require('../models/lib/jiraCompatApi.js');
const g = require('../models/lib/githubCompatApi.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('the four APIs, each OFF unless ticked', () => {
  assert.deepStrictEqual(o.OPTIONAL_API_KEYS, ['trello', 'jira', 'github', 'gitea']);
  assert.strictEqual(o.isOptionalApiEnabled({}, 'trello'), false);
  assert.strictEqual(o.isOptionalApiEnabled({ optionalApis: { trello: 'yes' } }, 'trello'), false, 'only true');
  assert.strictEqual(o.isOptionalApiEnabled({ optionalApis: { trello: true } }, 'trello'), true);
  assert.strictEqual(o.isOptionalApiEnabled({ optionalApis: { evil: true } }, 'evil'), false);
  assert.deepStrictEqual(o.cleanOptionalApis({ jira: true, evil: true, github: 1 }), { trello: false, jira: true, github: false, gitea: false });
  for (const api of o.OPTIONAL_APIS) assert.ok(api.base.startsWith('/api/compat/'), `${api.key} sits under /api, behind WITH_API`);
});

test('each client\'s own way of sending the token', () => {
  assert.strictEqual(o.compatToken('trello', { query: { key: 'k', token: 'T1' } }), 'T1');
  assert.strictEqual(o.compatToken('trello', { authorization: 'OAuth oauth_consumer_key="k", oauth_token="T2"' }), 'T2');
  assert.strictEqual(o.compatToken('jira', { authorization: `Basic ${Buffer.from('anyone:T3').toString('base64')}` }), 'T3');
  assert.strictEqual(o.compatToken('github', { authorization: 'token T4' }), 'T4');
  assert.strictEqual(o.compatToken('gitea', { query: { token: 'T5' } }), 'T5');
  // negative: no token, no identity - WeKan's REST API then answers 401
  assert.strictEqual(o.compatToken('github', { query: { token: 'ignored' } }), '');
  assert.strictEqual(o.compatToken('jira', { authorization: 'Basic' }), '');
});

const board = { _id: 'B1', title: 'Dev', key: 'DEV', slug: 'dev', permission: 'private',
  labels: [{ _id: 'L1', name: 'bug', color: 'red' }, { _id: 'L2', name: 'v1', color: 'blue', dueAt: '2026-12-01' }, { _id: 'L3', name: 'x', color: 'crimson' }] };
const card = { _id: 'C1', boardId: 'B1', listId: 'LI1', title: 'Fix it', description: 'Body', cardNumber: 7, labelIds: ['L1', 'L2'],
  members: ['U1'], dueAt: '2026-10-20T00:00:00Z', createdAt: '2026-10-01T00:00:00Z', userId: 'U2' };

test('Trello shapes', () => {
  const c = t.card(card, { board });
  assert.deepStrictEqual([c.id, c.name, c.desc, c.idList, c.idShort, c.due], ['C1', 'Fix it', 'Body', 'LI1', 7, '2026-10-20T00:00:00.000Z']);
  assert.deepStrictEqual(c.labels.map(l => [l.name, l.color]), [['bug', 'red'], ['v1', 'blue']]);
  assert.strictEqual(t.label(board.labels[2], 'B1').color, null, 'a colour Trello lacks');
  const ch = t.cardChange({ name: 'New', due: null, idLabels: 'L1,L2', pos: 'top', closed: 'true' });
  assert.deepStrictEqual([ch.set.title, ch.unset.dueAt, ch.idLabels, ch.pos, ch.set.archived], ['New', '', ['L1', 'L2'], 'top', true]);
  assert.match(t.cardChange({ name: '  ' }).error, /name/);
  assert.match(t.cardChange({ due: 'soon' }).error, /due/);
});

test('Jira shapes and JQL', () => {
  const i = j.issue(card, { board, list: { _id: 'LI1', title: 'In Progress' } });
  assert.deepStrictEqual([i.key, i.fields.summary, i.fields.status.name, i.fields.labels, i.fields.duedate],
    ['DEV-7', 'Fix it', 'In Progress', ['bug', 'v1'], '2026-10-20']);
  const q = j.parseJql('project = DEV AND status = "In Progress" AND assignee = currentUser() ORDER BY key DESC');
  assert.deepStrictEqual([q.projects, q.statuses, q.assigneeMe, q.order], [['DEV'], ['in progress'], true, { field: 'key', dir: 'DESC' }]);
  assert.ok(j.matchesJql(i, j.parseJql('text ~ "fix" AND key = DEV-7'), 'U1'));
  assert.ok(!j.matchesJql(i, j.parseJql('status = Done'), 'U1'));
  // negative: JQL WeKan does not answer is an error, not a different answer
  assert.throws(() => j.parseJql('priority = High'), /not supported/);
  assert.match(j.issueChange({ summary: '' }).error, /summary/);
});

test('GitHub / Gitea shapes follow Version Control', () => {
  const i = g.issue(card, { board, listTitle: 'Closed' });
  assert.deepStrictEqual([i.number, i.state, i.labels.map(l => l.name), i.milestone.title], [7, 'closed', ['bug'], 'v1']);
  assert.strictEqual(g.issue(card, { board, listTitle: 'Open' }).state, 'open');
  assert.strictEqual(g.repo(board, 'wekan').full_name, 'wekan/DEV');
  assert.strictEqual(g.label(board.labels[0]).color, 'eb4646');
  const page = g.listIssues([{ number: 1, state: 'open', labels: [] }, { number: 2, state: 'closed', labels: [] }, { number: 3, state: 'open', labels: [{ name: 'bug' }] }],
    { state: 'open', perPage: 1, page: 1 });
  assert.deepStrictEqual([page.rows.map(r => r.number), page.last], [[3], 2]);
  assert.strictEqual(g.linkHeader('/api/compat/github/repos/w/DEV/issues?state=open', 1, 2),
    '</api/compat/github/repos/w/DEV/issues?state=open&page=2>; rel="next", </api/compat/github/repos/w/DEV/issues?state=open&page=2>; rel="last"');
  assert.match(g.issueChange({ state: 'merged' }).error, /state/);
});

const compatFiles = fs.readdirSync(path.join(ROOT, 'server/compatApi')).map(f => `server/compatApi/${f}`);

test('negative: no compatible API writes anything itself - only WeKan\'s REST API does', () => {
  for (const f of compatFiles) {
    const code = read(f).replace(/^\s*(\/\/|\*).*$/gm, '');
    assert.doesNotMatch(code, /\b(?:insertAsync|updateAsync|removeAsync|upsertAsync|\.direct\b|rawCollection|Meteor\.call|callAsync)\b/, `${f} writes past WeKan's REST API`);
    assert.doesNotMatch(code, /from '\/models\/(?!lib\/)/, `${f} imports a collection`);
  }
});

test('the core: off means 404, calls only WeKan\'s own /api on the loopback, as the caller', () => {
  const core = read('server/compatApi/core.js');
  const off = core.indexOf('if (!isOptionalApiEnabled(setting, key)) return send(res, 404');
  const route = core.indexOf('const route = routes.find(');
  assert.ok(off > 0 && off < route, 'the switch is checked before any route runs');
  assert.match(core, /if \(!\/\^\\\/api\\\/\[A-Za-z0-9\/_:\.-\]\*\$\/\.test\(path\)\) throw/);
  assert.match(core, /fetch\(`\$\{loopbackBase\(\)\}\$\{path\}`/);
  assert.match(core, /if \(ctx\.token\) headers\.Authorization = `Bearer \$\{ctx\.token\}`;/);
  for (const f of compatFiles.filter(x => !x.endsWith('core.js'))) {
    assert.doesNotMatch(read(f), /fetch\(|fetchSafe/, `${f} makes its own requests`);
  }
});

test('the Admin Panel ticks them, site admins only', () => {
  const m = read('server/methods/instanceFeatures.js');
  assert.match(m, /async saveOptionalApis\(input\) \{\s*await requireSiteAdmin\(\);/);
  assert.match(read('client/components/settings/settingBody.jade'), /each optionalApiRows/);
  assert.match(read('server/imports.js'), /import '\/server\/compatApi\/trello';/);
});

console.log(`# ${passed} passed`);
