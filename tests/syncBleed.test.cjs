'use strict';

// Guard: SyncBleed (GHSA-5q84-p3vr-f3xv). List Sync's Gitea/Forgejo/GitLab/
// Jira server URL is chosen by any board member with write access. It was
// fetched with the platform fetch(), so it reached 127.0.0.1, private networks
// and the cloud metadata address, and the first 200 bytes of a failed
// response were copied into the error the preview returns and lastSyncError
// stores. An open port and a closed one also answered differently.
// Run: node tests/syncBleed.test.cjs
//
// The test runs the real server/lib/listSyncFetch.js with the SSRF guard
// stubbed by what it does - refuse an internal address, return a response -
// and reproduces the report: the internal service's body never reaches the
// message, a guard refusal says nothing about what it resolved to, and both an
// open and a closed internal port read the same. The negative tests search the
// tree for the shape: an outbound request to a user-chosen URL through the
// platform fetch(), and response text copied into an error.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const SECRET = '{"error":"forbidden","hint":"admin console at /admin, db=10.0.0.5, svc_password=hunter2"}';
const INTERNAL = /^(127\.|10\.|169\.254\.|192\.168\.|\[::1\]|localhost)/;

// fetchSafe as the guard behaves: an internal host is refused before any
// request; anything else is answered by `respond`.
function harness(respond, { validate, env = {} } = {}) {
  const calls = [], records = [], direct = [];
  const context = {
    URL, Buffer, Headers, console, AbortSignal, process: { env },
    // The platform fetch, used only for a host the administrator allowed.
    fetch: async (url, options) => { direct.push({ url, options }); return respond(url, options); },
    require: name => {
      if (name === '/server/lib/securityLog') return { record: entry => records.push(entry) };
      throw new Error(`unexpected require ${name}`);
    },
    fetchSafe: async (url, options) => {
      const host = new URL(url).host;
      if (INTERNAL.test(host)) throw new Error(`SSRF_GUARD: Blocked IP 10.0.0.5 resolved for ${host}`);
      calls.push({ url, options });
      return respond(url, options);
    },
    validateAttachmentUrl: validate || (async url => (INTERNAL.test(new URL(url).host)
      ? { valid: false, reason: 'IP address is not allowed' } : { valid: true })),
  };
  vm.createContext(context);
  vm.runInContext(read('server/lib/listSyncFetch.js').replace(/^import .*$/gm, '').replace(/export /g, ''), context);
  return { context, calls, records, direct };
}
const forbidden = () => ({ ok: false, status: 403, headers: new Headers(),
  json: async () => JSON.parse(SECRET), text: async () => SECRET });
const credential = { username: 'u', token: 'attacker-token' };
const FETCHERS = [['gitea', 'fetchGiteaIssues', 'x/y'], ['forgejo', 'fetchGiteaIssues', 'x/y'],
  ['gitlab', 'fetchGitlabIssues', 'x/y'], ['jira', 'fetchJiraIssues', 'ABC']];

test('the reporter\'s attack: an internal address is refused with one message, for every provider', async () => {
  for (const [type, fetcher, projectKey] of FETCHERS) {
    for (const url of ['http://127.0.0.1:18765', 'http://169.254.169.254', 'http://10.0.0.5:8080', 'http://[::1]:3000']) {
      const { context, calls } = harness(forbidden);
      const error = await context[fetcher]({ type, url, projectKey }, credential).then(() => null, e => e);
      assert.ok(error && error.ssrfBlocked, `${type} ${url} is refused`);
      assert.equal(error.message,
        'The Sync server address is not allowed: private, loopback and link-local addresses are refused.');
      // What the name resolved to is internal information too.
      assert.doesNotMatch(error.message, /10\.0\.0\.5|127\.0\.0\.1|SSRF_GUARD/);
      assert.equal(calls.length, 0, 'no request reaches the internal service');
    }
  }
});

test('an open and a closed internal port read the same (the scan oracle is gone)', async () => {
  const open = harness(forbidden), closed = harness(() => { throw new Error('connect ECONNREFUSED'); });
  const a = await open.context.fetchGiteaIssues({ url: 'http://127.0.0.1:18765', projectKey: 'x/y' }, credential).catch(e => e.message);
  const b = await closed.context.fetchGiteaIssues({ url: 'http://127.0.0.1:18766', projectKey: 'x/y' }, credential).catch(e => e.message);
  assert.equal(a, b);
});

test('a failed or non-JSON answer from an allowed server carries only its origin and status', async () => {
  const { context } = harness(forbidden);
  const error = await context.fetchGiteaIssues({ url: 'https://tracker.example', projectKey: 'x/y' }, credential).catch(e => e);
  assert.equal(error.message, 'https://tracker.example responded with HTTP 403');
  assert.equal(error.status, 403);
  assert.doesNotMatch(error.message, /hunter2|forbidden|\/api\/v1/);
  const html = harness(() => ({ ok: true, status: 200, headers: new Headers(),
    json: async () => JSON.parse('<html>secret page</html>') }));
  const parse = await html.context.fetchGitlabIssues({ url: 'https://tracker.example', projectKey: 'x/y' }, credential).catch(e => e);
  assert.equal(parse.message, 'https://tracker.example did not answer with JSON');
});

test('every request goes through the guard with redirects refused and a bounded response', async () => {
  const { context, calls } = harness(() => ({ ok: true, status: 200, headers: new Headers(), json: async () => [] }));
  await context.fetchGiteaIssues({ url: 'https://tracker.example', projectKey: 'x/y' }, credential);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.maxRedirects, 0);
  assert.ok(calls[0].options.maxResponseBytes > 0 && calls[0].options.timeoutMs > 0);
  // The refusal is recorded once, as SyncBleed by server/listSync.js, not a
  // second time as DnsBleed by the guard.
  assert.equal(calls[0].options.recordBlocked, false);
});

test('saving Sync settings refuses an internal address and records the attempt', async () => {
  const { context, records } = harness(forbidden);
  const error = await context.assertSyncUrlAllowed('http://169.254.169.254', { userId: 'member' }).catch(e => e);
  assert.ok(error && error.ssrfBlocked);
  assert.deepEqual(records.map(r => [r.key, r.action, r.source, r.userId]),
    [['ssrf.list-sync', 'blocked', 'setListSyncSource', 'member']]);
  // An ordinary server is saved and nothing is recorded (negative).
  const ok = harness(forbidden);
  await ok.context.assertSyncUrlAllowed('https://gitea.example', { userId: 'member' });
  assert.equal(ok.records.length, 0);
  // A name that does not resolve now is left to the fetch, which checks again.
  const later = harness(forbidden, { validate: async () => ({ valid: false, reason: 'Hostname did not resolve' }) });
  await later.context.assertSyncUrlAllowed('https://gitea.example', {});
  assert.equal(later.records.length, 0);
});

test('only the administrator can allow a private host, and only that exact host', async () => {
  const ok = () => ({ ok: true, status: 200, headers: new Headers(), json: async () => [] });
  const env = { LIST_SYNC_ALLOWED_PRIVATE_HOSTS: ' 127.0.0.1 , Gitea.LAN ' };
  const allowed = harness(ok, { env });
  await allowed.context.fetchGiteaIssues({ url: 'http://127.0.0.1:3000', projectKey: 'x/y' }, credential);
  await allowed.context.fetchGiteaIssues({ url: 'http://gitea.lan', projectKey: 'x/y' }, credential);
  assert.equal(allowed.direct.length, 2);
  assert.equal(allowed.direct[0].options.redirect, 'error');
  await allowed.context.assertSyncUrlAllowed('http://127.0.0.1:3000', {});
  assert.equal(allowed.records.length, 0);
  // Any other internal host is still refused (negative), and an empty or
  // unset value allows nothing.
  for (const [url, settings] of [['http://localhost:3000', env], ['http://169.254.169.254', env],
    ['http://127.0.0.1:3000', { LIST_SYNC_ALLOWED_PRIVATE_HOSTS: ' , ' }], ['http://127.0.0.1:3000', {}]]) {
    const refused = harness(ok, { env: settings });
    const error = await refused.context.fetchGiteaIssues({ url, projectKey: 'x/y' }, credential).catch(e => e);
    assert.ok(error && error.ssrfBlocked, `${url} stays refused`);
    assert.equal(refused.direct.length + refused.calls.length, 0);
  }
  // A failure from the allowed host carries no response text either.
  const failing = harness(forbidden, { env });
  const error = await failing.context.fetchGiteaIssues({ url: 'http://127.0.0.1:3000', projectKey: 'x/y' }, credential).catch(e => e);
  assert.equal(error.message, 'http://127.0.0.1:3000 responded with HTTP 403');
});

test('the save-time validator checks an IPv6 literal as an address, not a name', async () => {
  // URL.hostname keeps the brackets ("[::1]"). Read as a name it failed DNS,
  // which the save check leaves to the fetch, so [::1] was saved (the browser
  // test found it). The real validator, as transitbleed.test.cjs loads it.
  const src = read('models/lib/attachmentUrlValidation.js')
    .replace(/^import [^\n]*\n/gm, '').replace(/^export (async function|function)/gm, '$1');
  const lib = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', 'Meteor', 'require', `${src}\nexports.validateAttachmentUrl = validateAttachmentUrl;`)(
    lib, { isServer: true }, require);
  for (const url of ['http://[::1]:3000', 'http://[fe80::1]/', 'http://[::ffff:127.0.0.1]/', 'http://[fd00::5]:8080']) {
    assert.deepEqual(await lib.validateAttachmentUrl(url), { valid: false, reason: 'IP address is not allowed' }, url);
  }
  // A public IPv6 literal is an address too, and allowed (negative).
  assert.deepEqual(await lib.validateAttachmentUrl('https://[2606:4700:4700::1111]/'), { valid: true });
});

test('the methods use the check, and the catalog names the attempt SyncBleed', () => {
  const methods = read('server/methods/listSync.js');
  assert.match(methods, /await assertSyncUrlAllowed\(source\.url, \{ userId: this\.userId \}\)/);
  assert.match(methods, /throw new Meteor\.Error\('sync-url-blocked', error\.message\)/);
  const sync = read('server/listSync.js');
  // Recorded before the preview returns, so a preview attempt is seen too.
  assert.match(sync, /if \(e && e\.ssrfBlocked\) \{\s*recordSyncUrlBlocked\([\s\S]*?\}\s*if \(dryRun\) return/);
  assert.match(read('models/lib/securityCategories.js'),
    /'ssrf\.list-sync':\s*\{ category: 'ssrf', bleed: 'SyncBleed', severity: 'medium', cwe: 'CWE-918' \}/);
});

// Server-side app sources (the code that can make an outbound request for a
// user), never generated bundles or dependencies.
function sourceFiles() {
  const skip = new Set(['node_modules', 'tests']);
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name) || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) out.push(full);
    }
  };
  for (const dir of ['server', 'models', 'imports']) walk(path.join(ROOT, dir));
  return out;
}

test('the platform fetch() is used only for fixed, WeKan-chosen hosts (negative)', () => {
  // Every other outbound request goes through fetchSafe. Each of these names
  // its host in the code, so no user can point it elsewhere.
  const FIXED = {
    'server/statistics.js': 'https://wekan.fi/version.txt',
    'server/trelloApiImport.js': 'the api.trello.com branch; downloads use fetchSafe',
    'server/lib/listSyncFetch.js': 'only a host in LIST_SYNC_ALLOWED_PRIVATE_HOSTS, set by the administrator',
  };
  const found = {};
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8').replace(/^\s*(\/\/|\*).*$/gm, '');
    const count = (text.match(/(^|[^\w.])fetch\(/g) || []).length;
    if (count) found[path.relative(ROOT, file)] = count;
  }
  assert.deepEqual(Object.keys(found).sort(), Object.keys(FIXED).sort(),
    'a new platform fetch() call: use fetchSafe for any URL a user can choose');
  for (const count of Object.values(found)) assert.equal(count, 1);
});

test('no response text from a user-chosen server reaches an error message (negative)', () => {
  const fetchFile = read('server/lib/listSyncFetch.js');
  assert.doesNotMatch(fetchFile, /\.text\(\)|statusText|body\.slice/);
  // Its one platform fetch() is behind the administrator's allow-list.
  assert.match(fetchFile, /response = operatorAllowedHost\(url\) \? await fetchOperatorHost\(url, headers\) : await fetchSafe\(url,/);
  // Response bodies copied into an error: only the fixed Trello API host.
  const echoes = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8');
    if (/new (Meteor\.)?Error\([\s\S]{0,200}?\$\{\s*body\.slice/.test(text)) echoes.push(path.relative(ROOT, file));
  }
  assert.deepEqual(echoes, ['server/trelloApiImport.js']);
  assert.match(read('server/trelloApiImport.js'), /const res = await trelloFetch\(`\$\{TRELLO_API\}\$\{path\}/);
});

// One attempt, one row. A Sync source somebody saved with an internal NAME
// before the fix used to be recorded twice when a member previewed it: as
// SyncBleed (medium) here and as DnsBleed (high) by the shared guard, and the
// high one disabled the previewing member's account
// (server/lib/blockOnSecurityEvent.js). The guard records by default; only a
// caller that records the refusal under its own name may turn that off.
test('the guard records a name resolving inward unless the caller records it itself', () => {
  const guard = read('server/lib/ssrfGuard.js');
  assert.match(guard, /async function resolveAndPin\(hostname, \{ recordBlocked = true \} = \{\}\)/);
  assert.match(guard, /if \(recordBlocked\) try \{\s*require\('\/server\/lib\/securityLog'\)\.record\(\{\s*key: 'ssrf\.fetch'/);
  // Anything but an explicit false keeps recording.
  assert.match(guard, /validateAndResolve\(currentUrl, \{ recordBlocked: options\.recordBlocked !== false \}\)/);
});

test('only a caller that records its own refusal turns the guard\'s record off (negative)', () => {
  // file -> how that file's caller records the refusal instead.
  const OWN_RECORD = {
    'server/lib/listSyncFetch.js': /blocked\.ssrfBlocked = true/,
  };
  const found = [];
  for (const file of sourceFiles()) {
    const text = fs.readFileSync(file, 'utf8').replace(/^\s*(\/\/|\*).*$/gm, '');
    if (/recordBlocked:\s*false/.test(text)) found.push(path.relative(ROOT, file));
  }
  assert.deepEqual(found.sort(), Object.keys(OWN_RECORD).sort());
  for (const [file, shape] of Object.entries(OWN_RECORD)) assert.match(read(file), shape, file);
  // And the caller of that file records every refusal the guard did not.
  assert.match(read('server/listSync.js'), /if \(e && e\.ssrfBlocked\) \{\s*recordSyncUrlBlocked\(/);
});
