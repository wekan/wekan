'use strict';

// CloudPanelBleed (2026-11-22): the Cloud Panel connects to MongoDB servers
// with credentials it is given, and until now any site administrator of any
// WeKan could switch it on from the browser - Admin Panel / People / Cloud -
// and make the server connect to MongoDB servers on its internal network. A
// customer is the administrator of their own WeKan container.
//
// The fix is a gate: the CLOUD environment variable. These guards read the
// source, so the fault cannot come back somewhere else:
//   * the only MongoClient built from data that is not the server's own
//     environment is the Cloud Panel's, and it is behind the CLOUD gate in
//     the very function that builds it;
//   * nothing reads the domain or SuperAdmin the browser used to set;
//   * the REST API at the CLOUD address refuses requests without a login,
//     in front of every route.
// The behaviour itself is in tests/cloudPanelAccess.test.cjs (every method
// refused without CLOUD) and tests/cloudPanel.test.cjs (the pure gate).
// Run: node tests/cloudPanelGate.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every source file of the running application - what a request, a method
// or a page can reach: not the tests, not dependencies, not the bundler's
// second copy of everything in _build/ (CLAUDE.md), and not the operator's
// command-line tools of snap-src/bin and releases/, which run in a shell
// with the arguments the operator types.
const APP_DIRS = ['server', 'models', 'imports', 'client', 'config', 'packages'];
const SKIP = new Set(['node_modules', '_build', '.build', '.tools', '.git', '.meteor', 'tests', '.npm']);
function sources(dir = null, out = []) {
  if (dir === null) {
    for (const top of APP_DIRS) sources(path.join(ROOT, top), out);
    return out;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('_build')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, out);
    else if (/\.(c|m)?js$/.test(entry.name)) out.push(path.relative(ROOT, full));
  }
  return out;
}

// A function's body, from its declaration to the closing brace at column 0.
function functionBody(src, signature) {
  const at = src.indexOf(signature);
  assert.notEqual(at, -1, `no ${signature}`);
  const end = src.indexOf('\n}\n', at);
  return src.slice(at, end + 2);
}

const BUILDS_A_CLIENT = /new\s+MongoClient\s*\(|MongoClient\.connect\s*\(/;

test('the only MongoClient built from data that is not the server\'s own environment is the Cloud Panel\'s', () => {
  const found = sources().filter(rel => !/[\\/]tests?[\\/]/.test(rel) && BUILDS_A_CLIENT.test(read(rel)));
  assert.deepEqual(found.sort(), ['server/cloudPanel.js', 'server/methods/migrateTextDatabase.js', 'server/models/attachmentStorageSettings.js'],
    'a new MongoClient anywhere else must be judged here: where does its address come from?');
  // Admin Panel / Attachments compacts the secondaries of the replica set
  // WeKan already runs on: their address is MONGO_URL's.
  const compact = read('server/models/attachmentStorageSettings.js');
  assert.match(compact, /buildDirectNodeUrl\(process\.env\.MONGO_URL, secondary\.name\)/);
  assert.match(compact, /&& process\.env\.MONGO_URL\)/);
  // The text database migration: to the URL the environment names, or the
  // fixed local default - never one the browser sends.
  const migrate = read('server/methods/migrateTextDatabase.js');
  assert.match(functionBody(migrate, 'function targetUrlFor('), /process\.env\.WEKAN_FERRETDB_URL[\s\S]*process\.env\.WEKAN_MONGODB_URL/);
  assert.match(migrate, /const targetUrl = targetUrlFor\(direction\);[\s\S]*MongoClient\.connect\(targetUrl\)/);
});

test('...and it is behind the CLOUD gate in the very function that builds it', () => {
  const src = read('server/cloudPanel.js');
  assert.equal((src.match(new RegExp(BUILDS_A_CLIENT.source, 'g')) || []).length, 1, 'one place');
  const withSource = functionBody(src, 'async function withSource(');
  assert.match(withSource, BUILDS_A_CLIENT, 'in withSource');
  const gate = withSource.indexOf('requireCloud(');
  assert.ok(gate !== -1 && gate < withSource.search(BUILDS_A_CLIENT), 'the gate comes first, whoever calls it');
  // The gate is the environment, read on every call - nothing stored.
  assert.match(functionBody(src, 'function cloudDomainNow('), /return C\.cloudDomainFromEnv\(\{ CLOUD: process\.env\.CLOUD \}\);/);
  const requireCloud = functionBody(src, 'function requireCloud(');
  assert.match(requireCloud, /cloudDomainNow\(\)/);
  assert.match(requireCloud, /recordRefusal\('authz\.cloud-panel-off'/, 'an attempt is recorded in Admin Panel / Problems');
  assert.match(requireCloud, /denied\(\)/);
  assert.match(functionBody(src, 'function recordRefusal('), /try \{[\s\S]*securityLog[\s\S]*\} catch \(e\) \{ \/\* logging must never break the guard \*\/ \}/);
  // Every method but the who-am-I passes the gate before anything else it
  // does, its argument checks included.
  assert.match(src, /for \(const name of Object\.keys\(METHODS\)\) \{\n  if \(name === 'cloudPanelWhoAmI'\) continue;[\s\S]*?requireCloud\(`method:\$\{name\}`\);\n    return method\.apply\(this, args\);[\s\S]*?\}\nMeteor\.methods\(METHODS\);/);
  // Every way into a customer's database starts at the gate too.
  for (const sig of ['async function onPanel(', 'async function ensureSupportBoard(']) {
    assert.match(functionBody(src, sig), /requireCloud\(/, sig);
  }
  assert.match(functionBody(src, 'async function customerLogin('), /const cloudDomain = cloudDomainNow\(\);\n  if \(!cloudDomain \|\|/);
});

test('negative: nothing reads the domain or SuperAdmin the browser used to set', () => {
  for (const rel of sources()) {
    const code = read(rel).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(code, /superAdminUsername/, `${rel}: the SuperAdmin setting is gone`);
    assert.doesNotMatch(code, /\.settings\.domain\b|all\.settings\b/, `${rel}: the stored Cloud Panel Domain is read by nothing`);
  }
  const client = sources().filter(rel => rel.startsWith('client/') || rel.startsWith('config/'));
  for (const rel of client) {
    assert.doesNotMatch(read(rel), /cloudPanel(Set|Get)Settings/, `${rel}: no page sets it`);
  }
  assert.doesNotMatch(read('client/components/cloud/cloudPanel.jade'), /cloudPanelSettings|superadmin/i);
  assert.doesNotMatch(read('client/components/settings/peopleBody.js'), /'cloud-setting'/, 'Admin Panel / People / Cloud is gone');
  const { ADMIN_PAGES } = require('../models/lib/adminUrls.js');
  assert.equal(ADMIN_PAGES.people.panes.cloud, undefined);
});

test('the REST API at the CLOUD address: refused without a login, in front of every route', () => {
  const mw = read('server/apiMiddleware.js');
  const gate = mw.indexOf('function cloudHostRestGate(');
  assert.ok(gate > mw.indexOf('function authenticateByToken('), 'after the token is read, so a signed-in export still works');
  assert.ok(gate < mw.indexOf("require('/server/lib/apiUsageLog')"), 'before the usage counting and every route');
  const body = mw.slice(gate, mw.indexOf('\n});', gate));
  // The server's own environment, by name, where tests/envVarCoverage.test.cjs sees it.
  assert.match(body, /cloudDomainFromEnv\(\{ CLOUD: process\.env\.CLOUD \}\)/);
  assert.match(body, /if \(!cloudDomain\) return next\(\);/, 'negative: a WeKan without CLOUD is unchanged');
  assert.match(body, /key: 'authn\.cloud-rest-off', action: 'blocked'/);
  const imports = read('server/imports.js');
  assert.ok(imports.indexOf("import '/server/apiMiddleware';") < imports.indexOf("import '/server/apiAuthRoutes';"),
    'the middleware is registered before POST /users/login and /users/register');
});

test('every refusal has its key, and none disables an account', () => {
  const { CATALOG } = require('../models/lib/securityCategories.js');
  for (const key of ['authz.cloud-panel-off', 'authz.cloud-panel-access', 'authn.cloud-admin-address', 'authn.cloud-rest-off']) {
    assert.ok(CATALOG[key], key);
    assert.equal(CATALOG[key].bleed, 'CloudPanelBleed', key);
    assert.equal(CATALOG[key].blocksAccount, false, `${key}: refused, and recorded, but nobody's account is disabled for it`);
  }
  const src = read('server/cloudPanel.js');
  for (const key of ['authz.cloud-panel-off', 'authz.cloud-panel-access', 'authn.cloud-admin-address']) {
    assert.ok(src.includes(`'${key}'`), `${key} is recorded`);
  }
});

console.log(`\ncloudPanelGate: ${passed} tests passed`);
