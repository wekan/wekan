'use strict';

// Meteor 3.5.3's six security fixes, in WeKan's forks of Meteor's own
// packages in packages/ (a local package overrides the release's). The forks
// were made because Meteor 3.6-rc.0 lacked the fixes; 3.6-rc.1 carries them,
// and the forks are rebased onto it for what is WeKan's own: the Admin Panel /
// Problems reports and the crypto-RNG keys (tests/meteorForkRandomKeys.test.cjs).
// This suite keeps checking that the fixes are there, whichever side has them.
// Run: node tests/meteor353SecurityFixes.test.cjs
//
// Each fix is tested by RUNNING the fixed code - the function is cut out of the
// fork and evaluated with stubs - and the negative tests look for the shape of
// each fault anywhere in packages/, server/, models/ and imports/, not only at
// the place Meteor fixed it.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { METEOR_SECURITY_KEYS, meteorSecurityEvent } = require('../models/lib/meteorSecurityEvent.cjs');
const { CATALOG } = require('../models/lib/securityCategories.js');

const { METEOR_PACKAGE_FORKS: FORKS } = require('./lib/meteorPackageForks.cjs');
const BASE_RELEASE = 'METEOR@3.6-rc.1';
// The wrap number a fork adds to the release's own version of the package.
const FORK_VERSION = /-rc360\.1_1$/;

let passed = 0;
let failed = 0;
const pending = [];
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(
    () => { passed += 1; console.log('  ok -', name); },
    (error) => { failed += 1; console.log('  FAIL -', name); console.log(error); },
  ));
}

// The source of a top-level `function name(...) {...}` or `const name = ... => {...};`.
function cut(src, start) {
  const at = src.indexOf(start);
  assert.notStrictEqual(at, -1, `not found: ${start}`);
  let depth = 0;
  for (let i = src.indexOf('{', at); i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}' && --depth === 0) {
      return src.slice(at, src[i + 1] === ';' ? i + 2 : i + 1);
    }
  }
  throw new Error(`unbalanced: ${start}`);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.npm' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(c?m?js|ts)$/.test(entry.name)) out.push(full);
  }
  return out;
}
const SOURCES = ['packages', 'server', 'models', 'imports', 'client']
  .flatMap(dir => walk(path.join(ROOT, dir)))
  .map(file => ({ file: path.relative(ROOT, file), text: fs.readFileSync(file, 'utf8') }));

// ── The forks are the ones in use, and only for the release they were made on ──

test(`the forks are for ${BASE_RELEASE}, and none outlives it`, () => {
  // A local package overrides the release's own SILENTLY. Moved to another
  // Meteor release, these would keep 3.6-rc.1's code under the new release's
  // name. So this fails the moment .meteor/release changes: check whether the
  // new release has the 3.5.3 fixes (the GitHub release notes list them) and
  // delete packages/<name> for each that does, or rebase the fork onto it.
  assert.strictEqual(read('.meteor/release').trim(), BASE_RELEASE,
    `.meteor/release moved past ${BASE_RELEASE}: re-check the forks in packages/ (${FORKS.join(', ')}) ` +
    'against the new release - remove each whose fix the release carries, rebase the rest');
});

test('every fork is marked as one, and .meteor/versions resolves to it', () => {
  const versions = read('.meteor/versions');
  for (const name of FORKS) {
    const version = read(`packages/${name}/package.js`).match(/version:\s*'([^']+)'/)[1];
    assert.match(version, FORK_VERSION, `${name}'s fork keeps 3.6-rc.1's version with a _1 wrap number: ${version}`);
    assert.ok(versions.split('\n').includes(`${name}@${version}`),
      `.meteor/versions must resolve ${name} to the fork ${version}`);
  }
});

test('ddp-server leaves out the git-fetched uWebSockets.js, as Meteor\'s published package does', () => {
  const pkg = read('packages/ddp-server/package.js');
  assert.ok(!/uWebSockets\.js"\s*:/.test(pkg), 'no npm dependency fetched from a git URL at build time');
  assert.ok(!/git\+https?:/.test(FORKS.map(n => read(`packages/${n}/package.js`)).join('\n')),
    'no fork depends on a git URL');
});

// ── 1. DDP: a protocol-handler name that is not the server's own ──────────────

const ddp = read('packages/ddp-server/livedata_server.js');
function ddpDispatches(name) {
  const cond = ddp.match(/if \(\s*(typeof msg\.msg === "string" &&\s*Object\.hasOwn\(self\.protocol_handlers, msg\.msg\))\s*\)/);
  assert.ok(cond, 'the dispatch requires an own, string handler name');
  const self = { protocol_handlers: { connect() {}, sub() {}, unsub() {}, method() {}, ping() {}, pong() {} } };
  return vm.runInNewContext(cond[1], { self, msg: { msg: name } });
}

test('DDP dispatches only the server\'s own handlers, by string name', () => {
  for (const name of ['connect', 'sub', 'method', 'ping']) assert.strictEqual(ddpDispatches(name), true, name);
  // What crashed the server: inherited names, and names that are not strings.
  for (const name of ['__proto__', 'toString', 'constructor', 'hasOwnProperty', 7, null, ['method'], { toString: () => 'method' }]) {
    assert.strictEqual(ddpDispatches(name), false, `must not dispatch ${JSON.stringify(name)}`);
  }
});

test('an async DDP handler that rejects is caught before it unblocks', () => {
  assert.ok(/result\s*\.catch\(\(e\) => \{[\s\S]{0,200}?\}\)\s*\.finally\(\(\) => unblock\(\)\)/.test(ddp),
    'the handler promise is caught, so a rejection cannot become an unhandled rejection');
});

test('negative: no code dispatches on `name in <handlers>` or lets a handler promise go uncaught', () => {
  for (const { file, text } of SOURCES) {
    assert.ok(!/if \(\s*msg\.msg in /.test(text), `${file} dispatches on an inherited-name check`);
    assert.ok(!/(?<!\.catch\([^;]*\)\s*)\bresult\.finally\(\(\) => unblock\(\)\)/.test(text),
      `${file}: an uncaught handler promise`);
  }
});

// ── 2. allow/deny: every modified top-level field reaches the validators ──────

const allowDeny = read('packages/allow-deny/allow-deny.js');
function modifiedFields(mutator) {
  const body = allowDeny.slice(allowDeny.indexOf('const mutatorKeys = Object.keys(mutator);'),
    allowDeny.indexOf('const fields = Object.keys(modifiedFields);'));
  const reports = [];
  const fn = vm.runInNewContext(`(function (self, userId, mutator) {
    ${cut(allowDeny, 'const ALLOWED_UPDATE_OPERATIONS = {')}
    ${body}
    return Object.keys(modifiedFields);
  })`, {
    hasOwn: Object.prototype.hasOwnProperty,
    noReplaceError: 'no replace',
    Meteor: { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } } },
    reportToWekan: evt => reports.push(evt),
  });
  return { fields: [...fn({ _name: 'boards' }, 'u1', mutator)], reports };
}

test('a top-level __proto__ is in the field list the validators see, and is recorded', () => {
  const { fields, reports } = modifiedFields({ $set: JSON.parse('{"__proto__": {"isAdmin": true}, "title": "x"}') });
  assert.deepStrictEqual(fields.sort(), ['__proto__', 'title']);
  assert.strictEqual(reports.length, 1);
  assert.strictEqual(reports[0].key, 'authz.allow-deny-proto-field');
});

test('ordinary and dotted fields are listed by their top-level part, and are not recorded', () => {
  const { fields, reports } = modifiedFields({ $set: { 'profile.name': 'a', sort: 1 }, $unset: { archived: '' } });
  assert.deepStrictEqual(fields.sort(), ['archived', 'profile', 'sort']);
  assert.deepStrictEqual(reports, []);
});

test('negative: no field-name map built from user input is a plain {} anywhere', () => {
  // `{}[name] = true` with name '__proto__' sets the prototype instead of a
  // key, so the name vanishes from Object.keys(): the allow/deny bypass.
  // The shape: a plain {} that the field names of an update modifier are then
  // written into as keys (`map[field] = true`).
  const shape = /\b(?:const|let|var)\s+(\w+)\s*=\s*\{\s*\};[\s\S]{0,1200}?\bObject\.keys\((?:params|modifier|mutator|[\w.]*\$set)\)[\s\S]{0,400}?\b\1\[\w+\]\s*=\s*(?:true|1)\b/;
  for (const { file, text } of SOURCES) {
    assert.ok(!shape.test(text),
      `${file} collects modifier field names in a plain object; use Object.create(null) or a Set`);
  }
  // ...and the check sees the shape Meteor shipped before 3.5.3.
  assert.ok(shape.test(`const modifiedFields = {};
    mutatorKeys.forEach((op) => { const params = mutator[op];
      Object.keys(params).forEach((field) => { modifiedFields[field] = true; }); });`));
});

// ── 3. dynamic import(): request size and complexity are bounded ──────────────

const di = read('packages/dynamic-import/server.js');
// Lazily, so an unfixed dynamic-import fails these tests rather than the file.
let limits;
const validateTree = tree => {
  limits = limits || require(path.join(ROOT, 'packages/dynamic-import/request-limits.js'));
  return vm.runInNewContext(`(${cut(di, 'function validateTree(tree) {')})`, { ...limits, Buffer })(tree);
};

test('dynamic import() accepts a module tree Meteor would ask for', () => {
  validateTree({ node_modules: { lodash: { 'index.js': 1 } }, client: { 'a.js': 1 } });
});

test('dynamic import() refuses deep, wide, oddly shaped and oversized-key trees', () => {
  validateTree({ a: 1 });
  let deep = 1;
  for (let i = 0; i <= limits.MAX_TREE_DEPTH + 1; i += 1) deep = { a: deep };
  const wide = Object.fromEntries(Array.from({ length: limits.MAX_KEYS_PER_OBJECT + 1 }, (_, i) => [`m${i}.js`, 1]));
  for (const [what, tree] of [['deep', deep], ['wide', wide], ['array', []], ['root leaf', 1],
    ['leaf not 1', { a: 2 }], ['long key', { ['k'.repeat(limits.MAX_KEY_BYTES + 1)]: 1 }]]) {
    assert.throws(() => validateTree(tree), err => /^dynamic import /.test(err.message), what);
  }
});

test('a refused tree is recorded, an oversized body is not, and both are refused', () => {
  assert.ok(/response\.writeHead\(413/.test(di) && /MAX_REQUEST_BYTES/.test(di), 'oversized bodies get 413');
  const refusal = di.slice(di.indexOf('validateTree(requestTree);'), di.indexOf('throw e;'));
  assert.ok(refusal.includes("key: 'dos.dynamic-import-request'"), 'the malformed-request path reports');
  const oversized = cut(di, 'const rejectOversizedRequest = () => {');
  assert.ok(!oversized.includes('reportToWekan'), 'an old open client may send an oversized request; not an attempt');
});

// ── 4 and 5. Google and Facebook direct-token login ───────────────────────────

const google = read('packages/google-oauth/google_server.js');
async function googleVerify({ tokenInfo, idTokenInfo, config = { clientId: 'web-id' }, idToken }) {
  const reports = [];
  const ctx = {
    reportToWekan: evt => reports.push(evt),
    Meteor: { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } } },
    ServiceConfiguration: { configurations: { findOneAsync: async () => config }, ConfigError: Error },
    fetchTokenInfo: async url => (url.includes('oauth2/v1') ? tokenInfo : idTokenInfo),
  };
  const fn = vm.runInNewContext(`(() => {
    ${google.match(/^const GOOGLE_ID_TOKEN_ISSUERS = .*;$/m)[0]}
    ${cut(google, 'const acceptedClientIds = (config) => {')}
    return ${cut(google, 'const verifyTokenClient = async (tokens) => {').replace(/^const verifyTokenClient = /, '').replace(/;$/, '')};
  })()`, ctx);
  try {
    return { result: await fn({ accessToken: 't', idToken }), reports };
  } catch (error) {
    return { error: error.error, reports };
  }
}

test('Google: a token issued to this application, or to a listed native client, is accepted', async () => {
  assert.strictEqual((await googleVerify({ tokenInfo: { audience: 'web-id' } })).result, null);
  assert.strictEqual((await googleVerify({ tokenInfo: { issued_to: 'ios-id' },
    config: { clientId: 'web-id', additionalClientIds: ['ios-id'] } })).result, null);
  const viaIdToken = await googleVerify({ tokenInfo: { audience: 'native' }, idToken: 'id',
    idTokenInfo: { aud: 'web-id', sub: '42', iss: 'https://accounts.google.com' } });
  assert.strictEqual(viaIdToken.result, '42');
});

test('Google: a token issued to another application is refused and recorded (negative)', async () => {
  const other = await googleVerify({ tokenInfo: { audience: 'attacker-app' } });
  assert.strictEqual(other.error, 403);
  assert.strictEqual(other.reports[0].key, 'authn.oauth-token-audience');
  const badIssuer = await googleVerify({ tokenInfo: { audience: 'x' }, idToken: 'id',
    idTokenInfo: { aud: 'web-id', sub: '42', iss: 'https://evil.example' } });
  assert.strictEqual(badIssuer.error, 403);
  // A network failure is refused too, but is not somebody's attempt.
  const down = await googleVerify({ tokenInfo: null });
  assert.strictEqual(down.error, 403);
  assert.deepStrictEqual(down.reports, []);
});

test('Google: the identity is the one the login proves, not one the client sends', () => {
  assert.ok(/String\(result\.serviceData\.id\) !== idTokenUserId/.test(google),
    'an access token accepted through an ID token must belong to that ID token\'s user');
  assert.ok(google.indexOf('await verifyTokenClient(tokens)') < google.indexOf('getServiceDataFromTokens(tokens);'),
    'the audience is verified before the identity derived from the token is trusted');
});

const facebook = read('packages/facebook-oauth/facebook_server.js');
async function facebookVerify(debugToken, { throwsNetwork = false } = {}) {
  const reports = [];
  const requests = [];
  const ctx = {
    API_VERSION: '22.0',
    reportToWekan: evt => reports.push(evt),
    Meteor: { Error: class extends Error { constructor(code, reason) { super(reason); this.error = code; } } },
    ServiceConfiguration: { configurations: { findOneAsync: async () => ({ appId: 123, secret: 'app-secret' }) }, ConfigError: Error },
    OAuth: {
      openSecret: s => s,
      _fetch: async (url, method, opts) => {
        requests.push({ url, opts });
        if (throwsNetwork) throw new Error(`fetch failed for ${url}?access_token=${opts.queryParams.access_token}`);
        return { json: async () => debugToken };
      },
    },
  };
  const fn = vm.runInNewContext(`(${cut(facebook, 'const verifyTokenApp = async (accessToken) => {')
    .replace(/^const verifyTokenApp = /, '').replace(/;$/, '')})`, ctx);
  try { await fn('t'); return { ok: true, reports, requests }; } catch (error) {
    return { error: error.error, message: error.message, reports, requests };
  }
}

test('Facebook: a valid token of this app is accepted, its numeric appId compared as a string', async () => {
  assert.strictEqual((await facebookVerify({ data: { is_valid: true, app_id: '123' } })).ok, true);
});

test('Facebook: an invalid token or another app\'s is refused and recorded (negative)', async () => {
  for (const data of [{ is_valid: true, app_id: '999' }, { is_valid: false, app_id: '123' }, {}]) {
    const r = await facebookVerify({ data });
    assert.strictEqual(r.error, 403);
    assert.strictEqual(r.reports[0].key, 'authn.oauth-token-audience');
  }
});

test('Facebook: a network error does not carry the app secret into the error', async () => {
  const r = await facebookVerify(null, { throwsNetwork: true });
  assert.strictEqual(r.error, 403);
  assert.ok(!r.message.includes('app-secret'), r.message);
  assert.deepStrictEqual(r.reports, [], 'a network failure is not an attempt');
});

test('Facebook: a verified token whose identity did not resolve logs nobody in', () => {
  assert.ok(/if \(!facebookData\.serviceData\?\.id\) \{\s*throw new Meteor\.Error\(403/.test(facebook));
  assert.ok(facebook.indexOf('await verifyTokenApp(request.accessToken)') <
    facebook.indexOf('Facebook.handleAuthFromAccessToken(request.accessToken'), 'verified before it is used');
});

// ── 6. meteor shell: history and compile cache stay private ───────────────────

const shell = read('packages/shell-server/shell-server.js');

test('meteor shell: the compile cache directory is made private, or not used', () => {
  const fns = vm.runInNewContext(`(() => {
    ${cut(shell, 'function getCacheDirectory(shellDir) {')}
    ${cut(shell, 'function getCacheOptions(shellDir) {')}
    return { getCacheOptions };
  })()`, { pathJoin: path.join, mkdirSync: fs.mkdirSync, chmodSync: fs.chmodSync });
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-shell-'));
  try {
    const opts = fns.getCacheOptions(tmp);
    assert.ok(opts && opts.cacheDirectory.startsWith(tmp));
    if (process.platform !== 'win32') {
      assert.strictEqual(fs.statSync(opts.cacheDirectory).mode & 0o777, 0o700);
    }
    // A cache directory that cannot be created means no cache, not a crash.
    fs.writeFileSync(path.join(tmp, 'blocker'), '');
    assert.strictEqual(fns.getCacheOptions(path.join(tmp, 'blocker')), false);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('meteor shell: the history file is opened 0600 through its descriptor', () => {
  assert.ok(/openSync\(historyFile, "a\+", 0o600\)/.test(shell));
  assert.ok(/fchmodSync\(historyFd, 0o600\)/.test(shell), 'the mode is set on the opened file, not the path');
  assert.ok(/compileForShell\(code, cacheOptions\)/.test(shell), 'compiling uses the private cache options');
});

// ── Deploy: WeKan never sends Meteor account credentials to a deploy server ───

test('negative: no WeKan script runs `meteor deploy`, the 3.5.3 fix that is in the tool', () => {
  // The deploy fix is in meteor-tool, which a package cannot replace. WeKan
  // is never deployed to Galaxy; this keeps it so.
  const scripts = ['build.sh', 'build.bat', 'rebuild-wekan.sh', 'releases', '.github', 'snap-src', 'docker']
    .map(p => path.join(ROOT, p)).filter(fs.existsSync)
    .flatMap(p => (fs.statSync(p).isDirectory() ? walkAll(p) : [p]));
  for (const file of scripts) {
    assert.ok(!/\bmeteor\s+deploy\b/.test(fs.readFileSync(file, 'utf8')), `${path.relative(ROOT, file)} runs meteor deploy`);
  }
});
function walkAll(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAll(full, out);
    else if (/\.(sh|bat|cmd|ps1|ya?ml|mjs|cjs|js|py)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// ── Admin Panel / Problems ────────────────────────────────────────────────────

test('every key a fork reports is in the catalog, never blocks an account, and is allowed by the hook', () => {
  const used = new Set();
  for (const name of FORKS) {
    for (const file of walk(path.join(ROOT, 'packages', name))) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/reportToWekan\(\{\s*key: '([^']+)'/g)) used.add(m[1]);
    }
  }
  assert.deepStrictEqual([...used].sort(), [...METEOR_SECURITY_KEYS].sort());
  for (const key of METEOR_SECURITY_KEYS) {
    assert.ok(CATALOG[key], `${key} is in models/lib/securityCategories.js`);
    assert.strictEqual(CATALOG[key].blocksAccount, false, `${key} must not block an account`);
  }
});

test('the hook passes only the fork keys, and strips anything that could block an account', () => {
  const ok = meteorSecurityEvent({ key: 'dos.ddp-protocol-handler', action: 'blocked', blocksAccount: true,
    userId: 'u'.repeat(100), detail: 'x'.repeat(500) });
  assert.strictEqual(ok.blocksAccount, false);
  assert.strictEqual(ok.userId.length, 64);
  assert.strictEqual(ok.detail.length, 200);
  assert.strictEqual(meteorSecurityEvent({ key: 'authn.inactive', action: 'blocked' }), null,
    'a package cannot report a WeKan key, and through it block an account');
  assert.strictEqual(meteorSecurityEvent(null), null);
  assert.strictEqual(meteorSecurityEvent({ key: 'dos.ddp-protocol-handler', action: 'erase' }).action, 'detected');
});

test('reporting can never break a guard: every fork wraps the hook in try/catch', () => {
  for (const name of ['allow-deny', 'ddp-server', 'dynamic-import', 'facebook-oauth', 'google-oauth']) {
    const file = { 'allow-deny': 'allow-deny.js', 'ddp-server': 'livedata_server.js', 'dynamic-import': 'server.js',
      'facebook-oauth': 'facebook_server.js', 'google-oauth': 'google_server.js' }[name];
    const helper = cut(read(`packages/${name}/${file}`), 'const reportToWekan = (event) => {');
    assert.ok(/try \{[\s\S]*globalThis\.__wekanSecurityRecord[\s\S]*\} catch \(e\)/.test(helper), name);
  }
  const hook = read('server/lib/meteorSecurityHook.js');
  assert.ok(/try \{[\s\S]*record\(event\);[\s\S]*\} catch \(e\)/.test(hook));
  assert.ok(/installMeteorSecurityHook\(\)/.test(read('server/main.js')), 'server/main.js installs the hook');
});

Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
});
