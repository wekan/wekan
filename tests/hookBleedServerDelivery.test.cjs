'use strict';

// #6782: moving a card with an outgoing webhook enabled was logged as HookBleed
// and disabled the mover's account.
//
// The activity hook delivered through Meteor.call('outgoingWebhooks'), and that
// method trusted a call without `this.connection` as the server's own. Meteor
// gives a server-side Meteor.call the connection AND userId of the method it
// runs in (ddp-server applyAsync: `connection = currentMethodInvocation
// .connection`), and a card moved from a browser runs in that browser's method,
// so the server's own delivery arrived as a "client" sending act-moveCard: the
// forge branch recorded ssrf.webhook-forge (high) with the mover's userId, and
// blockOnSecurityEvent set loginDisabled.
//
// Now the server delivers through deliverActivityWebhook(), a function no
// client can reach, and the method treats every call as a client's.
// Run: node tests/hookBleedServerDelivery.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/[^\n'"`]*$/gm, '$1');

function decision() {
  const catalogSrc = read('models/lib/securityCategories.js').replace(/^export \{[^}]*\};?\s*$/m, '');
  const catalog = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', `${catalogSrc}\nexports.categoryFor = categoryFor;`)(catalog);
  const src = read('server/lib/blockOnSecurityEvent.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^const \{ categoryFor \} = require[^\n]*\n/m, '')
    .replace(/^export /gm, '');
  const lib = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', 'Meteor', 'categoryFor', `${src}\nexports.shouldBlockAccount = shouldBlockAccount;`)(
    lib, { users: {} }, catalog.categoryFor);
  return lib.shouldBlockAccount;
}
const shouldBlockAccount = decision();

// server/notifications/outgoing.js, run with what it needs: the stored
// integration, the board, a webhookFetch that records what is sent, and a
// securityLog that records what is logged - and whether it would block.
function outgoing({ stored, member = true, fetch } = {}) {
  let method;
  const requests = [], logged = [];
  const context = {
    structuredClone, process: { env: {} }, console: { warn() {}, error() {} },
    Meteor: { methods: m => { method = m.outgoingWebhooks; }, Error: class extends Error {}, users: { find: () => ({ fetchAsync: async () => [] }) } },
    check() {}, Integrations: { Const: { TWOWAY: 'bidirectional-webhooks', GLOBAL_WEBHOOK_ID: '_global' } },
    CardComments: { direct: { updateAsync: async () => {} } },
    ReactiveCache: {
      getIntegration: async () => (stored ? structuredClone(stored) : null),
      getBoard: async () => ({ hasMember: () => member, members: [{ userId: 'mover', isActive: true }] }),
      getUser: async () => ({ username: 'mover', getLanguage: () => 'en' }),
      getCurrentSetting: async () => ({}),
      getCard: async id => (id === 'card' ? { _id: 'card', boardId: 'board', listId: 'list', title: 'Card' } : null),
    },
    TAPi18n: { ensureLanguageLoaded: async () => {}, __: (key, params) => `${key} ${params && params.card || ''}` },
    webhookFetch: async (url, request) => {
      if (fetch) return fetch(url, request);
      requests.push({ url, ...request });
      return { status: 200 };
    },
    require: name => {
      if (name === '/server/lib/securityLog') return { record: evt => logged.push({ ...evt, blocks: shouldBlockAccount(evt) }) };
      throw new Error(`unexpected require ${name}`);
    },
    ...require('../models/lib/webhookPayload'), ...require('../models/lib/notificationDelivery'),
    ...require('../models/lib/boardCardScope'),
  };
  const source = read('server/notifications/outgoing.js').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.runInNewContext(source, context);
  return { method, deliver: context.deliverActivityWebhook, requests, logged };
}

const HOOK = { _id: 'hook', boardId: 'board', url: 'https://chat.example/hook', type: 'outgoing-webhooks', enabled: true, token: 'stored-token' };
const MOVED = { user: 'mover', card: 'Card', cardId: 'card', boardId: 'board', listId: 'list', oldList: 'To do', list: 'Done', url: 'https://wekan.example/b/board/x/card' };
// What Meteor gives a server-side Meteor.call made inside a browser's method.
const INHERITED = { userId: 'mover', connection: { id: 'browser', clientAddress: '192.0.2.10' }, unblock() {} };

test('a card move with a webhook enabled is delivered, logs nothing and blocks nobody', async () => {
  const f = outgoing({ stored: HOOK });
  await f.deliver(HOOK, 'act-moveCard', MOVED, 'mover');
  assert.equal(f.requests.length, 1, 'act-moveCard reaches the webhook');
  assert.equal(f.requests[0].url, HOOK.url);
  assert.equal(f.requests[0].headers['X-Wekan-Token'], 'stored-token');
  assert.match(f.requests[0].body, /act-moveCard/);
  assert.deepEqual(f.logged, [], 'no HookBleed, so no account is disabled');
});

test('the delivery is the same whatever method context it runs in (the inherited context of #6782)', async () => {
  const f = outgoing({ stored: HOOK });
  // deliverActivityWebhook does not read `this`: called as Meteor would have
  // called the method, with the mover's connection, it still delivers.
  await f.deliver.call(INHERITED, HOOK, 'act-moveCard', MOVED, 'mover');
  assert.equal(f.requests.length, 1);
  assert.deepEqual(f.logged, []);
  assert.doesNotMatch(code(read('server/notifications/outgoing.js')).slice(
    read('server/notifications/outgoing.js').indexOf('async function deliverWebhook'),
  ).split('Meteor.methods(')[0], /\bthis\./, 'the server delivery never reads its context');
});

test('the activity hook delivers through the function, with the actor named, and never through a method', () => {
  const activities = read('server/models/activities.js');
  assert.match(activities, /import \{ deliverActivityWebhook \} from '\/server\/notifications\/outgoing';/);
  assert.match(activities, /safeDeliver\(\(\) => deliverActivityWebhook\(integration, delivered, deliveredParams, userId \|\| doc\.userId\)\)/);
  assert.doesNotMatch(code(activities), /Meteor\.(call|callAsync|apply|applyAsync)\(\s*['"]outgoingWebhooks/);
});

test('negative: a client sending anything but the card-opened notification is still refused and logged', async () => {
  for (const ctx of [INHERITED, { ...INHERITED, connection: null }]) {
    const f = outgoing({ stored: HOOK });
    await f.method.call(ctx, { _id: 'hook', boardId: 'board', type: 'bidirectional-webhooks' }, 'act-moveCard',
      { text: 'Your account is suspended, log in at https://phish.example' });
    assert.equal(f.requests.length, 0, `nothing sent (connection ${ctx.connection ? 'set' : 'null'})`);
    assert.equal(f.logged.length, 1);
    assert.equal(f.logged[0].key, 'ssrf.webhook-forge');
    assert.equal(f.logged[0].userId, 'mover');
    assert.equal(f.logged[0].blocks, true, 'a real forgery still costs the account');
  }
  // The method has no `this.connection` escape hatch any more: a null
  // connection (a server Meteor.call outside any method) is refused the same.
  const methodSrc = code(read('server/notifications/outgoing.js')).split('Meteor.methods(')[1];
  assert.doesNotMatch(methodSrc, /this\.connection/);
});

test('the card-opened notification still works, built from the card and the stored hook', async () => {
  const f = outgoing({ stored: HOOK });
  await f.method.call(INHERITED, { _id: 'hook', boardId: 'board' }, 'CardSelected', { cardId: 'card', text: 'forged text', user: 'Somebody else' });
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].headers['X-Wekan-Token'], 'stored-token');
  assert.doesNotMatch(f.requests[0].body, /forged text|Somebody else/);
  assert.deepEqual(f.logged, []);
  // Negative: not for a member of another board.
  const outsider = outgoing({ stored: HOOK, member: false });
  await outsider.method.call(INHERITED, { _id: 'hook', boardId: 'board' }, 'CardSelected', { cardId: 'card' });
  assert.equal(outsider.requests.length, 0);
});

test('a failing or unreachable webhook rejects only its own delivery, and blocks nobody', async () => {
  const { safeDeliver } = (() => {
    const sandbox = { console: { error() {} }, module: { exports: {} } };
    vm.runInNewContext(`${read('server/lib/webhookGuard.js').replace('export async function safeDeliver', 'async function safeDeliver')}\nmodule.exports = { safeDeliver };`, sandbox);
    return sandbox.module.exports;
  })();
  const down = outgoing({ stored: HOOK, fetch: async () => { throw new Error('ECONNREFUSED'); } });
  const result = await safeDeliver(() => down.deliver(HOOK, 'act-moveCard', MOVED, 'mover'));
  assert.equal(result.ok, false, 'the failure stays inside safeDeliver');
  assert.deepEqual(down.logged, []);
  const failing = outgoing({ stored: HOOK, fetch: async () => ({ status: 500 }) });
  assert.equal((await safeDeliver(() => failing.deliver(HOOK, 'act-moveCard', MOVED, 'mover'))).ok, false);
  assert.deepEqual(failing.logged, []);
  // A hook pointed at an internal address is refused and recorded - but the
  // mover did not write that URL, so it does not cost them their account,
  // even when the record is attributed to them from the request it ran in.
  const internal = outgoing({ stored: { ...HOOK, url: 'http://127.0.0.1:27017/' },
    fetch: async () => { throw new Error('SSRF_GUARD: 127.0.0.1 is not allowed'); } });
  await safeDeliver(() => internal.deliver(HOOK, 'act-moveCard', MOVED, 'mover'));
  assert.equal(internal.logged.length, 1);
  assert.equal(internal.logged[0].key, 'ssrf.webhook');
  assert.equal(shouldBlockAccount({ ...internal.logged[0], userId: 'mover' }), false);
});

test('negative: a disabled, deleted or unnamed hook is not delivered by the server either', async () => {
  for (const stored of [null, { ...HOOK, enabled: false }]) {
    const f = outgoing({ stored });
    await f.deliver(HOOK, 'act-moveCard', MOVED, 'mover');
    assert.equal(f.requests.length, 0);
  }
  const f = outgoing({ stored: HOOK });
  for (const args of [[null, 'act-moveCard', MOVED], [HOOK, undefined, MOVED], [HOOK, 'act-moveCard', null]]) {
    assert.equal(await f.deliver(...args, 'mover'), undefined);
  }
  assert.equal(f.requests.length, 0);
});

// The same mistake anywhere: a method that decides who called it from
// `this.connection` is reached by server code only outside any method
// invocation, or with that invocation cleared - otherwise it sees the client
// the server is working for (#6461 found it in the LDAP sync; #6782 in the
// webhooks).
test('negative: no server code calls a connection-gated method from inside a client\'s method', () => {
  const files = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['node_modules', '.npm', 'tests', 'client'].includes(e.name)) walk(rel); }
      else if (/\.(c|m)?js$/.test(e.name) && !/\.tests?\.js$/.test(e.name)) files.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'packages', 'imports']) walk(dir);
  const sources = Object.fromEntries(files.map(f => [f, code(fs.readFileSync(path.join(ROOT, f), 'utf8'))]));
  // Methods whose body branches on this.connection to tell server from client:
  // the method a gate is in is the nearest one declared before it.
  const gated = new Set();
  for (const src of Object.values(sources)) {
    for (const g of src.matchAll(/if\s*\(\s*this\.connection\s*(?:!==?\s*null\s*)?\)/g)) {
      const before = src.slice(Math.max(0, g.index - 4000), g.index);
      const names = [...before.matchAll(/(?:^|\n)\s*(?:async\s+([A-Za-z_]\w*)\s*\(|['"]?([A-Za-z_][\w.]*)['"]?\s*:\s*async\s+function\s*\()/g)];
      const last = names[names.length - 1];
      if (last) gated.add(last[1] || last[2]);
    }
  }
  assert.ok(gated.has('setUserOrgsTeamsFromLdap') && gated.has('setCreateTeamFromOidc'), `found the gated methods: ${[...gated]}`);
  assert.ok(!gated.has('outgoingWebhooks'), 'outgoingWebhooks no longer trusts a missing connection');
  // Where each of them is called from on the server, and why that is safe.
  const OUTSIDE_A_METHOD = {
    'packages/wekan-oidc/loginHandler.js': 'the OAuth HTTP callback (OAuth.registerService), which runs in no method',
    'packages/wekan-oidc/oidc_server.js': 'the OAuth HTTP callback (OAuth.registerService), which runs in no method',
    'packages/wekan-ldap/server/sync.js:propagateOrgTeamMembersToBoards': 'the background sync (no method) or Admin Panel Sync now, whose admin the method allows',
  };
  const problems = [];
  for (const [file, src] of Object.entries(sources)) {
    for (const m of src.matchAll(/Meteor\.(?:call|callAsync|apply|applyAsync)\(\s*([A-Za-z_]\w*|['"][\w.]+['"])/g)) {
      let name = m[1].replace(/['"]/g, '');
      if (name === 'functionName') name = 'setCreateTeamFromOidc'; // loginHandler.js picks Org/Team *FromOidc by name
      if (!gated.has(name)) continue;
      const before = src.slice(Math.max(0, m.index - 300), m.index);
      if (/DDP\._CurrentMethodInvocation\.withValue\(undefined/.test(before)) continue;
      if (OUTSIDE_A_METHOD[file] || OUTSIDE_A_METHOD[`${file}:${name}`]) continue;
      problems.push(`${file}: Meteor.call of ${name}`);
    }
  }
  assert.deepEqual(problems, []);
});

// server/lib/securityLog.js record() as it runs: the catalog, an ambient
// method invocation (the mover's - AsyncLocalStorage carries it into the
// fire-and-forget delivery), and the real block decision.
function securityLog() {
  const catalog = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', `${read('models/lib/securityCategories.js').replace(/^export \{[^}]*\};?\s*$/m, '')}\nexports.categoryFor = categoryFor;`)(catalog);
  const blocked = [], folded = [];
  const context = {
    process: { env: {} }, console,
    require: name => {
      if (name === '/models/lib/securityCategories') return catalog;
      if (name === '/models/lib/securityLogFormat') return { sanitizeDetail: d => String(d || '') };
      if (name === '/server/lib/loginAttemptThrottle') return { resolveClientKey: () => '192.0.2.10' };
      if (name === '/models/lib/geoHeaders') return { locationFromHeaders: () => undefined };
      throw new Error(`unexpected require ${name}`);
    },
    foldEventFireAndForget: doc => folded.push(doc),
    blockAccountForSecurityEvent: evt => { if (shouldBlockAccount(evt)) blocked.push(evt.userId); return false; },
    currentReportRequest: () => null,
    DDP: { _CurrentMethodInvocation: { get: () => INHERITED } },
  };
  const src = read('server/lib/securityLog.js').replace(/^import [^\n]*\n/gm, '').replace(/^export default [^\n]*\n/m, '').replace(/^export /gm, '');
  vm.runInNewContext(src, context);
  return { record: context.record, blocked, folded };
}

test('record() passes the catalog\'s blocksAccount to the block decision (a refused hook URL blocks nobody)', () => {
  const log = securityLog();
  // What deliverWebhook records for a hook pointed at an internal address,
  // inside the mover's method context.
  log.record({ key: 'ssrf.webhook', action: 'blocked', source: 'outgoingWebhooks', detail: 'webhook hook: SSRF_GUARD: DNS resolution failed' });
  assert.equal(log.folded.length, 1, 'still recorded');
  assert.equal(log.folded[0].userId, 'mover', 'still names who caused the delivery');
  assert.deepEqual(log.blocked, [], 'but does not disable them');
  // The other catalog keys that say blocksAccount: false, through record().
  for (const key of ['ssrf.redirect', 'ssrf.attachment']) log.record({ key, action: 'blocked', userId: 'u' });
  assert.deepEqual(log.blocked, []);
  // Negative: a forgery still blocks its sender, through record() too.
  log.record({ key: 'ssrf.webhook-forge', action: 'blocked', source: 'outgoingWebhooks', userId: 'forger' });
  assert.deepEqual(log.blocked, ['forger']);
  // And an explicit blocksAccount: false on the event wins.
  log.record({ key: 'ssrf.webhook-forge', action: 'blocked', userId: 'other', blocksAccount: false });
  assert.deepEqual(log.blocked, ['forger']);
});

test('negative: every catalog key that says blocksAccount: false is recorded only from paths that cannot override it', () => {
  const src = read('server/lib/securityLog.js');
  assert.match(src, /insert\(doc, \{ key: m\.key, blocksAccount: m\.blocksAccount \}\)/);
  assert.match(src, /blockAccountForSecurityEvent\(\{ \.\.\.doc, key: decision\.key, blocksAccount: decision\.blocksAccount \}\)/);
  assert.match(read('models/lib/securityCategories.js'), /'ssrf\.webhook':[^\n]*blocksAccount: false/);
  // The block decision is reached only through insert(): nothing else calls it.
  assert.equal((code(src).match(/blockAccountForSecurityEvent\(/g) || []).length, 1);
});
