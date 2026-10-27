'use strict';

// OIDCBleed - CVE-2026-53444 GHSA-cv95-8h7c-2ffq and CVE-2026-52893
// GHSA-mp7g-hj5q-gxhq (reported by alexwaira, fixed in WeKan v9.32,
// https://wekan.fi/hall-of-fame/oidcbleed/).
//
//   1. GHSA-cv95-8h7c-2ffq (CWE-269, CWE-862): six Meteor methods the OIDC
//      login flow calls server-side - setCreateOrgFromOidc,
//      setOrgAllFieldsFromOidc, setCreateTeamFromOidc, setTeamAllFieldsFromOidc,
//      groupRoutineOnLogin and boardRoutineOnLogin - were callable by any DDP
//      client. groupRoutineOnLogin set isAdmin from the caller's own data, so
//      `{groups:[{isAdmin:true,forceCreate:true}]}` made the caller a global
//      admin. Each now refuses a call that has a client connection
//      (`this.connection !== null`); the OIDC handshake's server-side
//      Meteor.callAsync has none.
//   2. GHSA-mp7g-hj5q-gxhq (CWE-287): Accounts.onCreateUser merged an OIDC
//      login into any account whose email OR username matched the claims. It
//      now matches by email only, merges only with OAUTH2_MERGE_EXISTING_USERS
//      =true AND email_verified=true from the provider, and otherwise refuses
//      with oidc-email-already-in-use. The behavioural merge cases are
//      exercised in tests/oidcProfileMerge.test.cjs; this file pins the gate.
//
// Both refusals are summarized in Admin Panel -> Problems: the org/team methods
// record auth-race.oidc directly, the two package methods through the
// oidc.internal-method-direct canary bridge, and a refused link through
// oauth.account-conflict.
//
// The TEST runs each of the six methods, cut out of its source file, with a
// client connection and with none. The NEGATIVE TEST requires every method the
// OIDC package calls, and every method anywhere named *FromOidc / *FromLdap /
// *RoutineOnLogin, to open with the connection guard - so a seventh such
// helper cannot be added callable by clients - and that the only account merge
// in onCreateUser sits behind the opt-in gate.
// Run: node tests/oidcBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Index of the `}` matching the `{` at `open`, skipping strings, template
// literals and comments.
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

// The method's parameter list and body, for `async name(` or
// `'name': async function(`.
function methodSource(src, name) {
  const re = new RegExp(`(?:async ${name}\\s*\\(|'${name}'\\s*:\\s*async\\s+function\\s*\\()`);
  const m = re.exec(src);
  if (!m) return null;
  const paramsOpen = m.index + m[0].length - 1;
  const paramsClose = src.indexOf(')', paramsOpen);
  const bodyOpen = src.indexOf('{', paramsClose);
  return {
    params: src.slice(paramsOpen + 1, paramsClose),
    body: src.slice(bodyOpen, matchBrace(src, bodyOpen) + 1),
  };
}

const SIX = [
  ['server/models/org.js', 'setCreateOrgFromOidc'],
  ['server/models/org.js', 'setOrgAllFieldsFromOidc'],
  ['server/models/team.js', 'setCreateTeamFromOidc'],
  ['server/models/team.js', 'setTeamAllFieldsFromOidc'],
  ['packages/wekan-oidc/oidc_server.js', 'groupRoutineOnLogin'],
  ['packages/wekan-oidc/oidc_server.js', 'boardRoutineOnLogin'],
];

function harness() {
  const writes = [];
  const events = [];
  class MeteorError extends Error { constructor(code) { super(code); this.error = code; } }
  const reached = new Error('reached-past-guard');
  const collection = {
    findOneAsync: async () => { throw reached; },
    updateAsync: async (...a) => { writes.push(a); throw reached; },
    insertAsync: async (...a) => { writes.push(a); throw reached; },
  };
  const context = vm.createContext({
    Meteor: { Error: MeteorError, users: collection },
    check() {},
    require: id => {
      if (id === '/server/lib/securityLog') return { record: e => events.push(e) };
      throw new Error(`unexpected require ${id}`);
    },
    global: { __wekanTripCanary: (id, ctx) => events.push({ canary: id, ...ctx }) },
    ReactiveCache: { getOrgs: async () => { throw reached; }, getTeams: async () => { throw reached; } },
    Org: collection, Team: collection, Boards: collection, Users: collection,
    authEnv: () => 'true', process: { env: { DEFAULT_BOARD_ID: 'b1', PROPAGATE_OIDC_DATA: 'true' } },
    oauth2AdminStatusFromGroups: () => { throw reached; },
  });
  return { context, writes, events, reached };
}

const ARGS = {
  groupRoutineOnLogin: [{ groups: [{ displayName: 'x', isAdmin: true, forceCreate: true }] }, 'oidc-attacker'],
  boardRoutineOnLogin: [{}, 'oidc-attacker'],
};

for (const [file, name] of SIX) {
  test(`${name} refuses a DDP client and records the attempt; a server-side call passes the guard`, async () => {
    const m = methodSource(read(file), name);
    assert.ok(m, `${file}: ${name} not found`);
    const args = ARGS[name] || ['x', 'x', 'x', 'x', 'x', true, true];

    const client = harness();
    const fn = vm.runInContext(`(async function (${m.params}) ${m.body})`, client.context);
    await assert.rejects(
      fn.apply({ connection: { id: 'browser', clientAddress: '192.0.2.7' }, userId: 'attacker' }, args),
      err => err.error === 'not-authorized',
    );
    assert.equal(client.writes.length, 0, 'nothing is written for a client call');
    assert.equal(client.events.length, 1, 'the refused call is recorded once');
    const ev = client.events[0];
    assert.ok(ev.key === 'auth-race.oidc' || ev.canary === 'oidc.internal-method-direct', JSON.stringify(ev));

    const server = harness();
    const fnServer = vm.runInContext(`(async function (${m.params}) ${m.body})`, server.context);
    // Past the guard the stubs throw `reached`, or the method returns early on
    // its own logic: either way it was not refused as a client call.
    try {
      await fnServer.apply({ connection: null, userId: null }, args);
    } catch (err) {
      assert.notEqual(err.error, 'not-authorized', `${name} refused the OIDC flow's own server-side call`);
    }
    assert.equal(server.events.length, 0, 'the legitimate server-side call is not recorded');
  });
}

test('the canary and catalog keys behind the recording exist', () => {
  const { canaryFor } = require('../models/lib/canaryTokens');
  const { CATALOG } = require('../models/lib/securityCategories');
  const entry = CATALOG['auth-race.oidc'];
  assert.equal(entry.bleed, 'OIDCBleed');
});

test('GHSA-mp7g-hj5q-gxhq: OIDC links an existing account only by email, opt-in, provider-verified', () => {
  const src = read('server/models/users.js');
  const start = src.indexOf('SECURITY (GHSA-mp7g-hj5q-gxhq)');
  const merge = src.indexOf('existingUser.services[service] = user.services[service];', start);
  assert.ok(start > 0 && merge > start, 'the OIDC link branch exists');
  const branch = src.slice(start, merge);
  assert.match(branch, /const existingUser = await ReactiveCache\.getUser\(\{\s*'emails\.address': email,\s*\}\);/);
  assert.doesNotMatch(branch.replace(/\/\/.*$/gm, ''), /getUser\(\{[^}]*\busername\b/, 'never matched by username');
  assert.match(branch, /authEnv\('OAUTH2_MERGE_EXISTING_USERS'\) === 'true'/);
  assert.match(branch, /user\.services\.oidc\.email_verified === true/);
  const gate = branch.indexOf('if (!mergeExistingUsers || !emailVerified) {');
  assert.ok(gate > 0, 'the fail-closed gate precedes the merge');
  const refusal = branch.slice(gate);
  assert.match(refusal, /tripCanary\('oauth\.account-conflict'/);
  assert.match(refusal, /catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  assert.ok(refusal.indexOf('tripCanary') < refusal.indexOf("'oidc-email-already-in-use'"));
});

test('negative: every login-flow-only method anywhere opens with the connection guard', () => {
  const files = execFileSync('git', ['ls-files', '*.js'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(f => f && !/^(tests|_build|\.build)\//.test(f) && !/\/tests?\//.test(f) && !f.includes('node_modules'))
    .filter(f => fs.existsSync(path.join(ROOT, f)));

  // Methods the OIDC package invokes itself are, by construction, login-flow-only.
  const called = new Set();
  for (const f of files.filter(f => f.startsWith('packages/wekan-oidc/'))) {
    const src = read(f);
    for (const m of src.matchAll(/Meteor\.callAsync\(\s*'(\w+)'/g)) called.add(m[1]);
    for (const m of src.matchAll(/'(\w+FromOidc)'/g)) called.add(m[1]);
  }
  for (const name of ['groupRoutineOnLogin', 'boardRoutineOnLogin', 'setCreateOrgFromOidc',
    'setOrgAllFieldsFromOidc', 'setCreateTeamFromOidc', 'setTeamAllFieldsFromOidc']) {
    assert.ok(called.has(name), `the OIDC flow no longer calls ${name}; update this guard`);
  }

  const definitions = [];
  const NAMED = /(?:async (\w+(?:FromOidc|FromLdap|RoutineOnLogin))\s*\(|'(\w+(?:FromOidc|FromLdap|RoutineOnLogin))'\s*:\s*async\s+function)/g;
  for (const f of files) {
    const src = read(f);
    if (!src.includes('Meteor.methods')) continue;
    for (const m of src.matchAll(NAMED)) definitions.push([f, m[1] || m[2]]);
    for (const name of called) {
      if (methodSource(src, name) && !definitions.some(d => d[0] === f && d[1] === name)) definitions.push([f, name]);
    }
  }
  for (const name of called) {
    assert.ok(definitions.some(d => d[1] === name), `${name} is called by the OIDC flow but defined nowhere`);
  }
  const offenders = definitions.filter(([f, name]) => {
    const body = methodSource(read(f), name).body
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    // The guard comes first: nothing but argument check()s (which
    // audit-argument-checks requires before any throw, see
    // server/ldapGroupSync.js) runs before the refusal.
    return !/^\{\s*(?:check\([^;]*\);\s*)*if \(this\.connection !== null\) \{/.test(body);
  });
  assert.deepEqual(offenders, [], 'a login-flow-only method must refuse client (DDP) calls first');
});

test('negative: onCreateUser has one account merge, and it is behind the gate', () => {
  const src = read('server/models/users.js');
  const merges = [...src.matchAll(/existingUser\.services\[\w+\]\s*=/g)];
  assert.equal(merges.length, 1, 'a second merge path would bypass the OAUTH2_MERGE_EXISTING_USERS gate');
  const gate = src.lastIndexOf('if (!mergeExistingUsers || !emailVerified) {', merges[0].index);
  assert.ok(gate > 0 && merges[0].index - gate < 2000, 'the merge directly follows its gate');
});
