'use strict';

// LOGOUT_IDLE_MINUTES: a browser session ends after its user has been idle
// that long (models/lib/idleLogout.js, server/idleLogout.js,
// client/lib/idleActivity.js).
//
//  - test: a session idle past the limit loses its login token, which signs
//    it out; activity keeps it; a new sign-in starts the clock;
//  - negative: a resumed login (a tab reconnecting by itself) is not activity;
//    REST API tokens, which have no session record, are never removed; with
//    the limit off nothing is recorded or removed; the browser reports at most
//    once a minute and not at all while the page only sits open.
//
// Run: node tests/idleLogout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const idle = require('../models/lib/idleLogout');
const { createIdleActivityReporter } = require('../client/lib/idleActivity');

let passed = 0;
const pending = [];
function test(name, fn) {
  pending.push(async () => { await fn(); passed += 1; console.log('  ok -', name); });
}
const env = values => name => values[name];
const MIN = 60 * 1000;

test('the limit: off unless set, whole minutes, at most a week', () => {
  assert.deepStrictEqual(idle.idleLogoutConfig(env({})), { enabled: false });
  assert.deepStrictEqual(idle.idleLogoutConfig(env({ LOGOUT_IDLE_MINUTES: '0' })), { enabled: false });
  assert.deepStrictEqual(idle.idleLogoutConfig(env({ LOGOUT_IDLE_MINUTES: '30' })), { enabled: true, minutes: 30 });
  assert.strictEqual(idle.idleLogoutConfig(env({ LOGOUT_IDLE_MINUTES: '999999' })).minutes, 10080);
  assert.strictEqual(idle.idleLogoutConfig(env({ LOGOUT_IDLE_MINUTES: 'soon' })).enabled, false);
  const now = new Date('2026-10-31T12:00:00Z');
  assert.strictEqual(idle.idleCutoff(now, { enabled: true, minutes: 30 }).toISOString(), '2026-10-31T11:30:00.000Z');
});

// server/idleLogout.js against an in-memory collection and users.
function loadServer(minutes) {
  const sessions = new Map();
  const users = {
    u1: { _id: 'u1', tokens: ['browser', 'api'] },
  };
  const loginHooks = [];
  const methods = {};
  let clock = new Date('2026-10-31T12:00:00Z');
  class FakeDate extends Date {
    constructor(...args) { if (args.length) super(...args); else super(clock.getTime()); }
    static now() { return clock.getTime(); }
  }
  const IdleSessionsImpl = {
    async upsertAsync({ _id }, mod) {
      const existing = sessions.get(_id);
      if (mod.$set) sessions.set(_id, { _id, ...(existing || {}), ...mod.$set });
      else if (mod.$setOnInsert && !existing) sessions.set(_id, { _id, ...mod.$setOnInsert });
      return 1;
    },
    find(selector) {
      return { fetchAsync: async () => [...sessions.values()].filter(s => s.lastActiveAt < selector.lastActiveAt.$lt) };
    },
    async removeAsync({ _id }) { sessions.delete(_id); },
  };
  const Meteor = {
    methods(defs) { Object.assign(methods, defs); },
    startup() {}, defer() {}, setInterval() {},
    users: {
      async updateAsync({ _id }, mod) {
        const user = users[_id];
        const token = mod.$pull['services.resume.loginTokens'].hashedToken;
        if (!user || !user.tokens.includes(token)) return 0;
        user.tokens = user.tokens.filter(t => t !== token);
        return 1;
      },
    },
  };
  const connectionTokens = { c1: 'browser' };
  const context = {
    Meteor, Date: FakeDate, console,
    Mongo: { Collection: function Collection() { return IdleSessionsImpl; } },
    Accounts: { onLogin: fn => loginHooks.push(fn), _getLoginToken: id => connectionTokens[id] },
    DDPRateLimiter: { addRule() {} },
    authEnv: name => (name === 'LOGOUT_IDLE_MINUTES' ? minutes : undefined),
    onAuthConfigChange() {}, ensureIndex: async () => {},
    require: p => (p === '/models/lib/idleLogout' ? idle : require(p)),
    module: { exports: {} },
  };
  const src = read('server/idleLogout.js')
    .replace(/^import .*;\n/gm, '')
    .replace(/^export const IdleSessions/m, 'const IdleSessions')
    .replace(/^export async function sweepIdleLogins/m, 'async function sweepIdleLogins')
    + '\nmodule.exports = { sweepIdleLogins };\n';
  vm.runInNewContext(src, context);
  return {
    sessions, users, methods,
    login: type => Promise.all(loginHooks.map(fn => fn({ type, user: { _id: 'u1' }, connection: { id: 'c1' } }))),
    touch: () => methods.touchActivity.call({ userId: 'u1', connection: { id: 'c1' } }),
    advance: ms => { clock = new Date(clock.getTime() + ms); },
    sweep: () => context.module.exports.sweepIdleLogins(new Date(clock.getTime())),
  };
}

test('an idle browser session is signed out; the REST token beside it is not', async () => {
  const s = loadServer('30');
  await s.login('password');
  s.advance(31 * MIN);
  assert.strictEqual(await s.sweep(), 1);
  assert.deepStrictEqual(s.users.u1.tokens, ['api'], 'the API token has no session record and stays');
  assert.strictEqual(s.sessions.size, 0);
});

test('activity keeps a session; idleness after it still ends it', async () => {
  const s = loadServer('30');
  await s.login('password');
  s.advance(20 * MIN);
  await s.touch();
  s.advance(20 * MIN);
  assert.strictEqual(await s.sweep(), 0, '20 minutes after the last activity');
  s.advance(11 * MIN);
  assert.strictEqual(await s.sweep(), 1);
});

test('negative: a tab reconnecting by itself does not keep the session alive', async () => {
  const s = loadServer('30');
  await s.login('password');
  s.advance(25 * MIN);
  await s.login('resume');
  s.advance(6 * MIN);
  assert.strictEqual(await s.sweep(), 1, 'the resume did not move the time');
});

test('a resumed login made before the limit was set starts the clock', async () => {
  const s = loadServer('30');
  await s.login('resume');
  assert.strictEqual(s.sessions.size, 1);
});

test('negative: with the limit off nothing is recorded or removed', async () => {
  const s = loadServer('');
  await s.login('password');
  assert.strictEqual(await s.touch(), false);
  s.advance(100000 * MIN);
  assert.strictEqual(await s.sweep(), 0);
  assert.strictEqual(s.sessions.size, 0);
  assert.deepStrictEqual(s.users.u1.tokens, ['browser', 'api']);
});

test('the browser reports at most once a minute, and only on activity', () => {
  let now = 0;
  let touches = 0;
  const listeners = {};
  const target = { addEventListener: (n, fn) => { listeners[n] = fn; }, removeEventListener: n => { delete listeners[n]; } };
  const r = createIdleActivityReporter({ target, touch: () => { touches += 1; }, now: () => now });
  r.start();
  assert.deepStrictEqual(Object.keys(listeners).sort(), ['keydown', 'mousedown', 'scroll', 'touchstart', 'wheel']);
  assert.strictEqual(touches, 0, 'nothing while the page only sits open');
  now = 30 * 1000; listeners.keydown();
  assert.strictEqual(touches, 0, 'within a minute of signing in');
  now = 61 * 1000; listeners.mousedown(); listeners.mousedown();
  assert.strictEqual(touches, 1);
  r.stop();
  assert.deepStrictEqual(Object.keys(listeners), []);
});

test('the pieces are wired: server import, sweep, browser start, no positional update', () => {
  assert.match(read('server/imports.js'), /import '\/server\/idleLogout';/);
  const server = read('server/idleLogout.js');
  assert.match(server, /Accounts\.onLogin\(/);
  assert.match(server, /DDPRateLimiter\.addRule\(\{ type: 'method', name: 'touchActivity' \}/);
  assert.doesNotMatch(server, /loginTokens\.\$\./, 'the positional $ is not on every database');
  const startup = read('client/00-startup.js');
  assert.match(startup, /Meteor\.call\('getIdleLogout'/);
  assert.match(startup, /Meteor\.call\('touchActivity'/);
});

(async () => {
  for (const run of pending) await run();
  console.log(`idleLogout: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
