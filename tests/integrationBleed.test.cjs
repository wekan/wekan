'use strict';

// IntegrationBleed - CVE-2026-41455 ("IntegrationBleed FileBleed", listed as
// IntegrationFileBleed; the "FileBleed" part of the
// IntegrationBleed Hall of Fame row; RebindBleed, CVE-2026-41454, is its DNS
// follow-up, covered by server/lib/tests/dnsbleed.security.tests.js and
// tests/internalWebhookHosts.test.cjs). Reported with a fix by Rodolphe GHIO,
// fixed in WeKan v8.35 (commit 2cd702f48d), https://wekan.fi/hall-of-fame/integrationbleed/.
//
// What was wrong, and what this pins:
//   1. The integration REST writes (create, edit, delete, add/remove
//      activities) asked only for READ access to the board, so any member -
//      read-only included - could point the board's webhooks anywhere. They now
//      require a board admin (Authentication.checkBoardAdmin).
//   2. The webhook URL was not validated, so the server could be made to post
//      to loopback / private / cloud-metadata addresses. Create and edit
//      validate it (validateAttachmentUrl), delivery goes through fetchSafe.
//   3. A webhook's JSON RESPONSE was acted on as an instruction: any webhook,
//      one-way included, could rewrite a comment on ANY board, or insert a new
//      comment as any userId. Only a bidirectional webhook may now update an
//      EXISTING comment, and only on its own board; nothing is ever inserted.
//
// And one sibling found while auditing this (HookUrlBleed shape, REST side): the
// board publication sends an integration's URL only to board admins, because a
// Slack/Mattermost/Teams incoming-webhook URL carries its secret in the path
// (tests/webhookUrlPublication.test.cjs), but GET /api/boards/:id/integrations
// gave it to every member who reads the board. Those reads now give
// non-admins the same fields the publication does.
//
// The NEGATIVE TESTS search for the shapes everywhere: no server code writes
// an integration without a board-admin decision, nothing turns a webhook
// response into a new comment, and no REST read anywhere hands out an
// integration's URL to a non-admin.
// Run: node tests/integrationBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');

function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
      continue;
    }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return i;
  }
  throw new Error('unbalanced braces');
}

function restRoutes(src) {
  const starts = [...src.matchAll(/WebApp\.handlers\.(get|post|put|delete|patch)\(\s*'([^']+)'/g)];
  return starts.map((m, k) => ({
    method: m[1].toUpperCase(), route: m[2],
    body: src.slice(m.index, k + 1 < starts.length ? starts[k + 1].index : src.length),
  }));
}

const integrations = read('server/models/integrations.js');

test('every integration REST write requires a board admin before writing', () => {
  const writes = restRoutes(integrations).filter(r => r.method !== 'GET');
  assert.ok(writes.length >= 5, `found ${writes.length} write routes`);
  for (const r of writes) {
    const at = r.body.indexOf('await Authentication.checkBoardAdmin(req.userId, paramBoardId);');
    const write = r.body.search(/Integrations(\.direct)?\.(insert|update|remove)Async\(/);
    assert.ok(at > 0, `${r.method} ${r.route} must require a board admin`);
    assert.ok(write > at, `${r.method} ${r.route} decides before it writes`);
    assert.doesNotMatch(r.body, /checkBoardAccess\(/, `${r.method} ${r.route} must not decide on read access`);
  }
});

test('create and edit validate the webhook URL before storing it', () => {
  const routes = restRoutes(integrations);
  const create = routes.find(r => r.method === 'POST' && r.route === '/api/boards/:boardId/integrations');
  const edit = routes.find(r => r.method === 'PUT' && r.route === '/api/boards/:boardId/integrations/:intId');
  for (const r of [create, edit]) {
    assert.ok(r);
    assert.match(r.body, /await validateAttachmentUrl\(req\.body\.url\)/);
  }
  assert.ok(create.body.indexOf('validateAttachmentUrl') < create.body.indexOf('Integrations.insertAsync('));
});

// The response handler, cut from server/notifications/outgoing.js and run.
function responseFunc() {
  const src = read('server/notifications/outgoing.js');
  const at = src.indexOf('const responseFunc = async (data, integration) => {');
  assert.ok(at > 0, 'responseFunc exists');
  const open = src.indexOf('{', src.indexOf('=>', at));
  const body = src.slice(open, matchBrace(src, open) + 1);
  const calls = { update: [], insert: [] };
  const comment = { _id: 'c1', cardId: 'card1', boardId: 'own' };
  const context = vm.createContext({
    Integrations: { Const: { ONEWAY: 'outgoing-webhooks', TWOWAY: 'bidirectional-webhooks' } },
    Lock: { set() {} },
    ReactiveCache: {
      getCardComment: async q => (q._id === comment._id && q.cardId === comment.cardId && q.boardId === comment.boardId ? comment : null),
      getBoard: async id => ({ _id: id }),
      getCard: async id => ({ _id: id }),
    },
    CardComments: {
      direct: {
        updateAsync: async (...a) => { calls.update.push(a); },
        insertAsync: async (...a) => { calls.insert.push(a); },
        update: (...a) => { calls.update.push(a); },
        insert: (...a) => { calls.insert.push(a); },
      },
      insertAsync: async (...a) => { calls.insert.push(a); },
    },
  });
  return { fn: vm.runInContext(`(async (data, integration) => ${body})`, context), calls };
}

test('a webhook response updates only an existing comment, on its own board, from a two-way webhook', async () => {
  const twoWay = { type: 'bidirectional-webhooks', boardId: 'own' };
  const ok = { boardId: 'own', cardId: 'card1', commentId: 'c1', comment: 'edited by the receiver' };

  let r = responseFunc();
  await r.fn(ok, twoWay);
  assert.equal(r.calls.update.length, 1, 'the legitimate two-way edit still works');
  assert.equal(JSON.stringify(r.calls.update[0][1]), JSON.stringify({ $set: { text: 'edited by the receiver' } }));

  r = responseFunc();
  await r.fn(ok, { type: 'outgoing-webhooks', boardId: 'own' });
  assert.equal(r.calls.update.length, 0, 'a one-way webhook response is not an instruction');

  r = responseFunc();
  await r.fn({ ...ok, boardId: 'victim' }, { ...twoWay });
  assert.equal(r.calls.update.length, 0, 'no comment on another board');

  r = responseFunc();
  await r.fn({ boardId: 'own', cardId: 'card1', commentId: 'missing', comment: 'x', userId: 'victim' }, twoWay);
  assert.equal(r.calls.update.length + r.calls.insert.length, 0, 'an unknown comment is not created as anybody');

  r = responseFunc();
  await r.fn({ boardId: 'own', cardId: 'card1', comment: 'x', userId: 'victim' }, twoWay);
  assert.equal(r.calls.insert.length, 0, 'no comment is inserted from a response');

  r = responseFunc();
  await r.fn(ok, undefined);
  assert.equal(r.calls.update.length, 0, 'no integration, no action');
});

test('the integration REST reads give a non-admin no URL (HookUrlBleed, REST sibling)', async () => {
  const at = integrations.indexOf('async function integrationFieldsFor(userId, boardId) {');
  assert.ok(at > 0, 'integrationFieldsFor exists');
  const open = integrations.indexOf('{', integrations.indexOf(')', at));
  const body = integrations.slice(open, matchBrace(integrations, open) + 1);
  const board = { members: [
    { userId: 'admin', isActive: true, isAdmin: true },
    { userId: 'reader', isActive: true, isAdmin: false },
    { userId: 'formerAdmin', isActive: false, isAdmin: true },
  ] };
  const context = vm.createContext({
    ReactiveCache: {
      getBoard: async () => board,
      getUser: async q => (q._id === 'siteAdmin' && q.isAdmin === true ? { _id: 'siteAdmin' } : null),
    },
  });
  const fieldsFor = vm.runInContext(`(async function (userId, boardId) ${body})`, context);
  const SAFE = { boardId: 1, enabled: 1, activities: 1 };
  assert.deepEqual({ ...(await fieldsFor('admin', 'b')) }, { token: 0 });
  assert.deepEqual({ ...(await fieldsFor('siteAdmin', 'b')) }, { token: 0 });
  assert.deepEqual({ ...(await fieldsFor('reader', 'b')) }, SAFE);
  assert.deepEqual({ ...(await fieldsFor('formerAdmin', 'b')) }, SAFE);

  // Exactly what the publication gives a non-admin.
  assert.match(read('server/publications/boards.js'), /isBoardAdmin \? \{ token: 0 \} : \{ boardId: 1, enabled: 1, activities: 1 \}/);
  for (const r of restRoutes(integrations).filter(x => x.method === 'GET')) {
    assert.match(r.body, /const fields = await integrationFieldsFor\(req\.userId, paramBoardId\);/, r.route);
    assert.match(r.body, /\{ fields \}/, r.route);
  }
});

const SERVER_FILES = execFileSync('git', ['ls-files', 'server/*.js', 'server/**/*.js'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(f => f && !/\/tests?\//.test(f) && fs.existsSync(path.join(ROOT, f)));

test('negative: no server code writes an integration without a board-admin or site-admin decision', () => {
  const ADMIN = /checkBoardAdmin\(|allowIsBoardAdmin\w*\(|hasAdmin\(|isAdmin|requireSiteAdmin\(|checkAdminOrCondition\(/;
  const offenders = [];
  for (const f of SERVER_FILES) {
    const src = stripComments(read(f));
    for (const m of src.matchAll(/Integrations(?:\.direct)?\.(?:insert|update|remove|upsert)(?:Async)?\(/g)) {
      // The enclosing handler: from the nearest route, method or allow rule.
      const from = Math.max(
        src.lastIndexOf('WebApp.handlers.', m.index),
        src.lastIndexOf('JsonRoutes.add(', m.index),
        src.lastIndexOf('Meteor.methods(', m.index),
        src.lastIndexOf('.allow(', m.index),
        src.lastIndexOf('\nexport async function', m.index),
        src.lastIndexOf('\nasync function', m.index),
      );
      const scope = src.slice(Math.max(0, from), m.index);
      if (!ADMIN.test(scope)) offenders.push(`${f}: ${src.slice(m.index, m.index + 40)}`);
    }
  }
  assert.deepEqual(offenders, []);
  // The client's own writes go through the allow rules, which ask for a board admin.
  const allow = read('server/permissions/integrations.js');
  assert.match(allow, /return isAdmin \|\| allowIsBoardAdmin\(userId, await Boards\.findOneAsync\(doc\.boardId\)\);/);
  for (const op of ['insert', 'update', 'remove']) {
    assert.match(allow, new RegExp(`async ${op}\\(userId, doc\\) \\{\\s*return await permissionHelper\\.allow\\(userId, doc\\);`));
  }
});

test('negative: nothing in the server turns a webhook response into a new comment', () => {
  const outgoing = stripComments(read('server/notifications/outgoing.js'));
  assert.doesNotMatch(outgoing, /CardComments(\.direct)?\.insert(Async)?\(/);
  for (const f of SERVER_FILES) {
    const src = stripComments(read(f));
    if (!/response\.data|responseFunc/.test(src)) continue;
    if (!/fetchSafe|webhook/i.test(src)) continue;
    assert.doesNotMatch(src, /CardComments(\.direct)?\.insert(Async)?\(\s*\{[^}]*\bdata\.userId\b/,
      `${f}: a webhook response must never choose the author of a comment`);
  }
});

test('negative: no REST read anywhere hands out an integration with its URL to a non-admin', () => {
  const offenders = [];
  for (const f of SERVER_FILES) {
    if (f.startsWith('server/publications/')) continue; // tests/webhookUrlPublication.test.cjs
    for (const r of restRoutes(stripComments(read(f)))) {
      if (!/getIntegrations?\(|Integrations\.find(One)?(Async)?\(/.test(r.body)) continue;
      // Reads behind a board-admin check, or fields chosen per caller, or
      // a projection that leaves the URL out, are fine.
      if (/checkBoardAdmin\(/.test(r.body) && r.body.indexOf('checkBoardAdmin(') < r.body.search(/getIntegrations?\(|Integrations\.find/)) continue;
      if (/integrationFieldsFor\(/.test(r.body)) continue;
      const projections = [...r.body.matchAll(/fields: (\{[^}]*\})/g)].map(m => m[1]);
      if (projections.length && projections.every(p => !/token: 0/.test(p) && !/\burl\b/.test(p))) continue;
      offenders.push(`${f}: ${r.method} ${r.route}`);
    }
  }
  assert.deepEqual(offenders, []);
});
