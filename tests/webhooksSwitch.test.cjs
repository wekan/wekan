'use strict';

// Admin Panel / Settings / Features / Turn off all webhooks, and Admin Panel /
// Problems / Webhooks (models/lib/webhooksSwitch.js, server/webhooksSwitch.js,
// docs/Features/Admin-Panel/Settings/Turn-Off-All-Webhooks.md).
// Run: node tests/webhooksSwitch.test.cjs
//
// While the switch is on the server sends no webhook and refuses to add or
// change one. "Sends no webhook" is checked where it can be decided - the
// queue's own logic, with fake collections - and, for the rest, by reading
// every sender: a file that calls webhookFetch() must ask the switch or say
// why it is not a webhook, so a sender added later cannot skip it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const lib = require('../models/lib/webhooksSwitch');
const { createWebhookOutbox } = require('../server/lib/webhookOutbox');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }));
}

// The text of the block that opens at the first `{` from `from`, braces
// matched outside strings, template literals and comments.
function blockAt(src, from) {
  const open = src.indexOf('{', from);
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      for (i += 1; i < src.length && src[i] !== c; i += 1) if (src[i] === '\\') i += 1;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') { depth -= 1; if (depth === 0) return src.slice(open, i + 1); }
  }
  throw new Error('unbalanced block');
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'tests' || entry.name === 'node_modules') continue;
      walk(rel, out);
    } else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

console.log('webhooksSwitch:');

// ── The decision ────────────────────────────────────────────────────────────

test('the switch is on only for an explicit true', () => {
  assert.strictEqual(lib.webhooksDisabled({ webhooksDisabled: true }), true);
  for (const setting of [null, undefined, {}, { webhooksDisabled: false }, { webhooksDisabled: 'true' }, { webhooksDisabled: 1 }]) {
    assert.strictEqual(lib.webhooksDisabled(setting), false, `${JSON.stringify(setting)} keeps webhooks on`);
  }
  assert.deepStrictEqual(lib.WEBHOOKS_DISABLED, { error: 'webhooks-disabled', reason: 'Webhooks are turned off' });
});

// ── The queue sends nothing, and keeps what waits ───────────────────────────

function fakeJobs() {
  const calls = [];
  const jobs = {
    calls,
    insertOne: async doc => { calls.push(['insertOne', doc]); },
    findOne: async () => null,
    aggregate: () => { calls.push(['aggregate']); return { toArray: async () => [{ _id: 'hook' }] }; },
    find: () => ({ sort: () => ({ limit: () => ({ toArray: async () => {
      calls.push(['find']);
      return [{ _id: 'j1', integrationId: 'hook', groupKey: 'g', body: { text: 'x' }, attempts: 0 }];
    } }) }) }),
    updateMany: async (selector, modifier) => { calls.push(['updateMany', selector, modifier]); },
    updateOne: async (selector, modifier) => { calls.push(['updateOne', selector, modifier]); },
  };
  const leases = { updateOne: async () => ({ matchedCount: 1 }), deleteOne: async () => {} };
  return { jobs, leases };
}

function outbox({ off }) {
  const { jobs, leases } = fakeJobs();
  const posts = [];
  const state = { off };
  const queue = createWebhookOutbox({
    jobs, leases, leaseOptions: { heartbeatMs: 0 },
    getIntegration: async () => ({ _id: 'hook', enabled: true, type: 'outgoing-webhooks', url: 'https://hook.example/x', token: 't' }),
    post: async (url, request) => { posts.push({ url, request }); return { status: 200 }; },
    webhooksOff: async () => state.off,
  });
  return { queue, jobs, posts, state };
}

test('turned off, the queue stores nothing new and sends nothing', async () => {
  const f = outbox({ off: true });
  const id = await f.queue.enqueue({ integrationId: 'hook', eventId: 'e1', groupKey: 'g', body: { text: 'x' }, deliverAt: Date.now() });
  assert.strictEqual(id, null, 'nothing is queued');
  await f.queue.drain();
  await f.queue.drainIntegration('hook');
  assert.deepStrictEqual(f.posts, [], 'no POST');
  assert.ok(!f.jobs.calls.some(([op]) => op === 'insertOne'), 'no job stored');
  assert.ok(!f.jobs.calls.some(([op]) => op === 'aggregate'), 'drain does not even look');
  assert.ok(!f.jobs.calls.some(([op, , modifier]) => op === 'updateMany' && modifier && modifier.$set && modifier.$set.state),
    'no waiting job is marked sent, failed or cancelled - it is kept');
});

test('turned on, the same queue stores and sends (the positive case)', async () => {
  const f = outbox({ off: false });
  const id = await f.queue.enqueue({ integrationId: 'hook', eventId: 'e1', groupKey: 'g', body: { text: 'x' }, deliverAt: Date.now() });
  assert.ok(typeof id === 'string' && id.length === 64);
  await f.queue.drain();
  assert.strictEqual(f.posts.length, 1);
  assert.strictEqual(f.posts[0].request.headers['X-Wekan-Token'], 't');
});

test('a webhook queue made without the switch keeps working as before', async () => {
  const { jobs, leases } = fakeJobs();
  const posts = [];
  const queue = createWebhookOutbox({ jobs, leases, leaseOptions: { heartbeatMs: 0 },
    getIntegration: async () => ({ _id: 'hook', enabled: true, type: 'outgoing-webhooks', url: 'https://h.example/' }),
    post: async url => { posts.push(url); return { status: 204 }; } });
  await queue.drain();
  assert.deepStrictEqual(posts, ['https://h.example/']);
});

test('turned off during a pass, the claimed jobs are released untouched (negative)', async () => {
  const f = outbox({ off: false });
  let asked = 0;
  f.queue = createWebhookOutbox({
    jobs: f.jobs, leases: { updateOne: async () => ({ matchedCount: 1 }), deleteOne: async () => {} },
    leaseOptions: { heartbeatMs: 0 },
    getIntegration: async () => ({ _id: 'hook', enabled: true, type: 'outgoing-webhooks', url: 'https://hook.example/x' }),
    post: async url => { f.posts.push(url); return { status: 200 }; },
    // drain() asks first (on), drainIntegration() asks again after claiming (off).
    webhooksOff: async () => { asked += 1; return asked > 1; },
  });
  await f.queue.drain();
  assert.deepStrictEqual(f.posts, []);
  const release = f.jobs.calls.find(([op, , m]) => op === 'updateMany' && m && m.$unset && 'attemptId' in m.$unset);
  assert.ok(release, 'the attempt id is cleared so the jobs wait for the next pass');
});

// ── Every sender asks ───────────────────────────────────────────────────────

test('every listed sender asks the switch', () => {
  for (const file of lib.SENDERS) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} is listed but does not exist`);
    // Code, not comments: a call, or the function handed to the queue.
    const code = read(file).split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
    assert.ok(/\bwebhooksOff(\(\)|,)/.test(code), `${file} sends webhooks and never asks webhooksOff()`);
  }
});

test('a file that calls webhookFetch() is a listed sender or says why it is not a webhook (negative)', () => {
  const callers = walk('server').filter(file => file !== 'server/sandstormEgress.js' && /\bwebhookFetch\s*\(/.test(read(file)));
  assert.ok(callers.length >= 5, `found only ${callers.length} webhookFetch callers - the scan is broken`);
  const unlisted = callers.filter(file => !lib.SENDERS.includes(file) && !(file in lib.NOT_WEBHOOKS));
  assert.deepStrictEqual(unlisted, [],
    'these files send through webhookFetch() but are neither in SENDERS (and so ask the switch) '
    + 'nor in NOT_WEBHOOKS with a reason');
  for (const [file, reason] of Object.entries(lib.NOT_WEBHOOKS)) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} is listed but does not exist`);
    assert.ok(typeof reason === 'string' && reason.length > 20, `${file} needs a real reason`);
  }
});

test('a file that enqueues into the webhook queue is a listed sender (negative)', () => {
  const enqueuers = walk('server').filter(file => /webhookOutbox\.enqueue\s*\(|outbox\(\)\.enqueue\s*\(/.test(read(file)));
  const unlisted = enqueuers.filter(file => !lib.SENDERS.includes(file));
  assert.deepStrictEqual(unlisted, [], 'these files queue webhooks without being a listed sender');
});

test('outgoing.js: deliverWebhook asks before anything else, and both entry points ask', () => {
  const src = read('server/notifications/outgoing.js');
  const body = blockAt(src, src.indexOf('async function deliverWebhook('));
  const first = body.slice(1).trim().split('\n').find(line => !line.trim().startsWith('//'));
  assert.match(first, /if \(await webhooksOff\(\)\) return undefined;/, 'the first statement of deliverWebhook');
  const activity = blockAt(src, src.indexOf('export async function deliverActivityWebhook('));
  assert.match(activity, /webhooksOff\(\)/);
  const method = blockAt(src, src.indexOf('async outgoingWebhooks('));
  assert.ok(method.indexOf('webhooksOff()') > -1 && method.indexOf('webhooksOff()') < method.indexOf('storedIntegrationOf('),
    'the method asks before it reads the integration');
});

test('the queue is built with the switch, and Sync webhooks complete without sending', () => {
  assert.match(read('server/notifications/webhookQueue.js'), /createWebhookOutbox\(\{[\s\S]*webhooksOff,[\s\S]*\}\)/);
  const src = read('server/notifications/storedWebhooks.js');
  const run = blockAt(src, src.indexOf('export async function runStoredSyncWebhooks('));
  assert.ok(run.indexOf('webhooksOff()') > -1 && run.indexOf('webhooksOff()') < run.indexOf('ensureWebhookPlan('),
    'asked before the plan is built or delivered');
  assert.match(run, /return require\('\/server\/lib\/syncWebhookPlan'\)\.planId\(saved\._id\)/,
    'the stage answers with its receipt id, as the coordinator expects');
});

test('the login and registration webhook asks before sending, and its save is refused', () => {
  const src = read('server/accountWebhook.js');
  const send = blockAt(src, src.indexOf('function send('));
  assert.ok(send.indexOf('webhooksOff()') < send.indexOf('webhookFetch('));
  const save = blockAt(src, src.indexOf('async saveAccountWebhook('));
  assert.ok(save.indexOf('refuseWebhookWriteWhenOff(') > save.indexOf('requireSiteAdmin('),
    'refused after the site-admin check');
  assert.ok(save.indexOf('refuseWebhookWriteWhenOff(') < save.indexOf('Settings.updateAsync('));
});

test('bots: no dispatch while off, and a Rule\'s other actions still run', () => {
  const src = read('server/bots.js');
  assert.match(blockAt(src, src.indexOf('async function enqueue(')), /webhooksOff\(\)\) return;/);
  assert.match(blockAt(src, src.indexOf(') {', src.indexOf('export async function dispatchToBot('))), /webhooksOff\(\)\) return null;/,
    'returns rather than throws: rulesHelper.js awaits it among other actions');
  assert.match(blockAt(src, src.indexOf('async botDispatch(')), /webhooks-disabled/);
});

test('activities look up no webhook while off', () => {
  const src = read('server/models/activities.js');
  assert.match(src, /import \{ webhooksOff \} from '\/server\/webhooksSwitch';/);
  const at = src.indexOf('if (await webhooksOff()) return;');
  assert.ok(at > -1 && at < src.indexOf('const integrations = await activityWebhookIntegrations(board, description);'));
});

// ── Every write is refused, and recorded ────────────────────────────────────

test('client inserts and updates of Integrations are denied while off; removes are not', () => {
  const src = read('server/permissions/integrations.js');
  const deny = src.slice(src.indexOf('Turn off all webhooks'));
  for (const op of ['insert', 'update']) {
    const body = blockAt(deny, deny.indexOf(`async ${op}(`));
    assert.match(body, /webhooksOff\(\)/);
    assert.match(body, /recordWebhookWriteRefused\(/);
    assert.match(body, /return true;/);
  }
  assert.ok(!/async remove\(/.test(deny), 'a remove is the cleanup and is never denied');
});

test('the REST routes refuse after the board-admin check; DELETE is not refused', () => {
  const src = read('server/models/integrations.js');
  const routes = [
    "WebApp.handlers.post('/api/boards/:boardId/integrations', ",
    "WebApp.handlers.put('/api/boards/:boardId/integrations/:intId', ",
    "'/api/boards/:boardId/integrations/:intId/activities',\n  async function(req, res) {\n    try {\n      const paramBoardId = req.params.boardId;\n      const paramIntId = req.params.intId;\n      const newActivities = req.body.activities;\n      await Authentication.checkBoardAdmin(req.userId, paramBoardId);\n      if (!(await integrationOr404(res, paramBoardId, paramIntId))) return;\n      if (await refusedWhileWebhooksOff(req, res, 'DELETE",
  ];
  for (const route of routes) {
    const at = src.indexOf(route);
    assert.ok(at > -1, `route not found: ${route.slice(0, 60)}`);
    const body = blockAt(src, at);
    assert.ok(body.indexOf('refusedWhileWebhooksOff(') > body.indexOf('checkBoardAdmin('), `${route.slice(0, 60)} checks the admin first`);
    assert.ok(body.indexOf('refusedWhileWebhooksOff(') < body.indexOf('Integrations.'), `${route.slice(0, 60)} refuses before any write`);
  }
  assert.strictEqual((src.match(/await refusedWhileWebhooksOff\(/g) || []).length, 4, 'POST, PUT and both activities routes');
  const del = blockAt(src, src.indexOf("WebApp.handlers.delete('/api/boards/:boardId/integrations/:intId', "));
  assert.ok(!del.includes('refusedWhileWebhooksOff'), 'deleting a webhook stays allowed');
  const helper = blockAt(src, src.indexOf('async function refusedWhileWebhooksOff('));
  assert.match(helper, /code: 403/);
  assert.match(helper, /recordWebhookWriteRefused\(/);
});

test('a webhook\'s own delivery settings are refused while off, the instance and board defaults are not', () => {
  const src = read('server/methods/notificationDelivery.js');
  const at = src.indexOf('refuseWebhookWriteWhenOff(');
  assert.ok(at > src.indexOf("// scope === 'integration'"), 'only the integration scope');
  assert.ok(at < src.indexOf('await Integrations.updateAsync('));
});

test('the refusal is recorded in Admin Panel / Problems without disabling the account', () => {
  // An ES module: read as text, like tests/hallOfFameProblemsCoverage.test.cjs.
  const src = read('models/lib/securityCategories.js');
  assert.match(src, /'authz\.webhooks-disabled': \{ category: 'authz', bleed: 'Webhooks turned off', severity: 'medium', cwe: 'CWE-284', blocksAccount: false \}/);
  const server = read('server/webhooksSwitch.js');
  const record = blockAt(server, server.indexOf(') {', server.indexOf('export function recordWebhookWriteRefused(')));
  assert.match(record, /try \{[\s\S]*key: 'authz\.webhooks-disabled', action: 'blocked'[\s\S]*\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
});

test('only refused writes are recorded, never a webhook that was not sent', () => {
  for (const file of ['server/notifications/outgoing.js', 'server/notifications/webhookQueue.js',
    'server/notifications/storedWebhooks.js', 'server/lib/webhookOutbox.js']) {
    assert.ok(!/authz\.webhooks-disabled|recordWebhookWriteRefused|refuseWebhookWriteWhenOff/.test(read(file)),
      `${file} must not record a silent non-send`);
  }
});

// ── The setting and the report are site administrators' ────────────────────

test('the switch is saved by a site administrator only, and published to every client', () => {
  const server = read('server/webhooksSwitch.js');
  const save = blockAt(server, server.indexOf('async saveWebhooksDisabled('));
  assert.match(save, /check\(value, Boolean\)/);
  assert.ok(save.indexOf('requireSiteAdmin(this.userId)') < save.indexOf('Settings.updateAsync('));
  assert.match(save, /clearWebhooksSwitchCache\(\)/);
  assert.match(read('server/publications/settings.js'), /\n  webhooksDisabled: 1,\n/);
  assert.match(read('models/settings.js'), /webhooksDisabled: \{\n\s+type: Boolean,\n\s+optional: true,/);
  assert.match(read('server/imports.js'), /import '\/server\/webhooksSwitch';/);
});

test('a non-admin cannot read the report (negative)', () => {
  const server = read('server/webhooksSwitch.js');
  const method = blockAt(server, server.indexOf('async webhooksReportPage(input) {\n    check('));
  assert.ok(method.indexOf('requireSiteAdmin(this.userId)') > -1);
  assert.ok(method.indexOf('requireSiteAdmin(this.userId)') < method.indexOf('return webhooksReportPage('),
    'the site-admin check comes before any read');
  const guard = blockAt(server, server.indexOf('async function requireSiteAdmin('));
  assert.match(guard, /user\.isAdmin !== true\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.ok(!/Meteor\.publish\(/.test(server), 'no publication: the rows are a method\'s answer only');
});

// ── The report rows ─────────────────────────────────────────────────────────

test('a report row shows whether a token is set, never the token', () => {
  const row = lib.webhookReportRow({ _id: 'i1', boardId: 'b1', userId: 'u1', title: 'Chat', url: 'https://chat.example/hooks/abc',
    type: 'outgoing-webhooks', enabled: true, activities: ['act-createCard'], token: 'very-secret-token',
    mattermostDirectMessages: true, notificationDelivery: { webhook: { grouping: 'board' } } },
  { board: { title: 'Sales', slug: 'sales' }, owner: { username: 'alice', profile: { fullname: 'Alice A' } } });
  assert.ok(!JSON.stringify(row).includes('very-secret-token'), 'the token never leaves the server');
  assert.strictEqual(row.tokenSet, true);
  assert.strictEqual(row.boardTitle, 'Sales');
  assert.strictEqual(row.ownerUsername, 'alice');
  assert.strictEqual(row.ownerFullname, 'Alice A');
  assert.strictEqual(row.typeKey, 'outgoing-webhooks');
  assert.strictEqual(row.allActivities, false);
  assert.deepStrictEqual(row.activities, ['act-createCard']);
  assert.strictEqual(row.mattermostDirectMessages, true);
  assert.strictEqual(row.ownDelivery, true);
  assert.strictEqual(lib.webhookReportRow({ token: '' }).tokenSet, false);
  assert.strictEqual(lib.webhookReportRow({}).tokenSet, false);
});

test('a global webhook, a two-way one, a bot and a missing board', () => {
  assert.strictEqual(lib.webhookReportRow({ boardId: '_global' }).isGlobal, true);
  assert.strictEqual(lib.webhookReportRow({ boardId: '_global' }).boardMissing, false);
  assert.strictEqual(lib.webhookReportRow({ boardId: 'gone' }).boardMissing, true);
  assert.strictEqual(lib.webhookReportRow({ type: 'bidirectional-webhooks' }).typeKey, 'bidirectional-webhooks');
  assert.strictEqual(lib.webhookReportRow({ bot: true }).typeKey, 'bots');
  assert.strictEqual(lib.webhookReportRow({ enabled: false }).enabled, false);
  assert.strictEqual(lib.webhookReportRow({ activities: ['all'] }).allActivities, true);
});

test('a URL keeps its host and path, and loses a password and a token parameter', () => {
  assert.strictEqual(lib.maskUrl('https://user:pw@hook.example/p?token=abc&room=1'),
    'https://user:***@hook.example/p?token=***&room=1');
  assert.strictEqual(lib.maskUrl('https://hook.example/p?api_key=1&sig=2&x=3'), 'https://hook.example/p?api_key=***&sig=***&x=3');
  assert.strictEqual(lib.maskUrl(''), '');
  assert.strictEqual(lib.maskUrl(undefined), '');
  assert.strictEqual(lib.maskUrl('not a url'), 'not a url');
});

test('the report query is bounded, and its filter and search are plain values (negative)', () => {
  assert.deepStrictEqual(lib.cleanReportQuery({}), { filter: 'all', search: '', limit: 25, skip: 0 });
  assert.deepStrictEqual(lib.cleanReportQuery({ filter: { $ne: 1 }, search: { $regex: '.' }, limit: 1e9, skip: -5 }),
    { filter: 'all', search: '', limit: lib.REPORT_MAX_LIMIT, skip: 0 });
  assert.deepStrictEqual(lib.reportSelector('on'), { enabled: { $ne: false } });
  assert.deepStrictEqual(lib.reportSelector('off'), { enabled: false });
  assert.deepStrictEqual(lib.reportSelector('$where'), {});
  const row = lib.webhookReportRow({ title: 'Deploys', url: 'https://ci.example/x' }, { owner: { username: 'bob' } });
  assert.ok(lib.matchesSearch(row, 'deplo'));
  assert.ok(lib.matchesSearch(row, 'CI.EXAMPLE'));
  assert.ok(lib.matchesSearch(row, 'bob'));
  assert.ok(!lib.matchesSearch(row, '.*'), 'a search is text, not a pattern');
  assert.ok(lib.matchesSearch(row, ''));
});

Promise.all(pending).then(() => {
  console.log(`webhooksSwitch: ${passed} passed`);
}, error => {
  console.error(error);
  process.exitCode = 1;
});
