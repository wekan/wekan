'use strict';

// A Meteor local package under packages/ is its own isolated build unit: it
// cannot import an app-tree module (an ES import naming an absolute path
// like '/models/settings' or a relative '../../models/...' reaching outside
// the package directory). That import resolves fine at edit time and even
// through a plain Node require (which is how every tests/*.test.cjs file
// runs it, and why this exact bug shipped once already - packages/wekan-ldap/
// server/ldap.js imported Settings and resolveConfigValue from '/models/...'
// directly), but fails the moment Meteor's own package linker loads it for
// real: "Error: Cannot find module '/models/settings'", crashing the server
// at boot. The fix was to vendor the small pure pieces a package needs and
// inject anything stateful (Settings access) from the app side via a setter
// (setLdapSettingsAccessor, wired by server/ldapAdminSettingsBridge.js).
//
// This is the negative sweep: nothing under packages/ may import an
// app-tree absolute path, anywhere, so the same mistake cannot reappear in
// a different package or a different file of this one.
//
// Run: node tests/packageAppImportBoundary.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.npm') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.js$/.test(entry.name)) out.push(full);
  }
  return out;
}

// An app-tree absolute import: a leading '/' followed by one of the app's
// own top-level source directories - never a package name (those start with
// 'meteor/' or a bare npm package name) and never a package-relative path.
const APP_ABSOLUTE_IMPORT =
  /(?:from|require\()\s*['"]\/(models|server|client|imports)\//;

console.log('packageAppImportBoundary:');

test('no file under packages/ imports an app-tree absolute path', () => {
  const offenders = [];
  for (const file of walk(PACKAGES_DIR)) {
    const src = fs.readFileSync(file, 'utf8');
    const m = APP_ABSOLUTE_IMPORT.exec(src);
    if (m) offenders.push(`${path.relative(ROOT, file)}: ${m[0]}`);
  }
  assert.deepStrictEqual(offenders, [],
    `these package files import app-tree code, which Meteor's package linker\n`
    + `cannot resolve at runtime even though a plain Node require can:\n`
    + offenders.join('\n'));
});

test('wekan-ldap/server/ldap.js no longer imports Settings or the app configResolver', () => {
  const src = fs.readFileSync(
    path.join(PACKAGES_DIR, 'wekan-ldap', 'server', 'ldap.js'), 'utf8');
  assert.ok(!/from ['"]\/models\/settings['"]/.test(src));
  assert.ok(!/from ['"]\/models\/lib\/configResolver['"]/.test(src));
  assert.ok(/export function setLdapSettingsAccessor/.test(src),
    'Settings access must be injected by the app, not imported by the package');
  // Every LDAP_* setting is resolved by the app (server/lib/authConfig.js
  // authEnv, Admin Panel value first) and handed in through that accessor, so
  // an override reaches every variable rather than a chosen few, and ldap.js
  // no longer needs the vendored configResolver itself.
  const settingsGet = src.slice(src.indexOf('static settings_get('), src.indexOf('async connect()'));
  assert.ok(/ldapSetting\(name\)/.test(settingsGet), 'settings_get reads through the accessor');
  assert.ok(!/process\.env\[name\]/.test(settingsGet), 'and never straight from the environment');
});

// wekan-ldap reads every setting through the accessor above, so it carried a
// vendored copy of models/lib/configResolver.js that nothing imported; it was
// removed (2026-10-16). No package may bring an unused copy back.
test('no package carries a configResolver copy it does not use', () => {
  const copies = [];
  for (const pkg of fs.readdirSync(PACKAGES_DIR)) {
    const walk = dir => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { if (!['.npm', 'node_modules'].includes(e.name)) walk(full); }
        else if (e.name === 'configResolver.js') copies.push(path.relative(ROOT, full));
      }
    };
    walk(path.join(PACKAGES_DIR, pkg));
  }
  assert.deepStrictEqual(copies, []);
});

test('wekan-oidc/oidc_server.js no longer imports the app oauth2ClientSecretJwt module', () => {
  const src = fs.readFileSync(
    path.join(PACKAGES_DIR, 'wekan-oidc', 'oidc_server.js'), 'utf8');
  assert.ok(!/require\(['"]\/models\/lib\/oauth2ClientSecretJwt['"]\)/.test(src));
  assert.ok(/require\(['"]\.\/oauth2ClientSecretJwt['"]\)/.test(src),
    'it must use the vendored package-local copy instead');
});

test('packages/wekan-oidc/oauth2ClientSecretJwt.js is the only copy', () => {
  // It used to be vendored from models/lib/oauth2ClientSecretJwt.js, which
  // nothing in the app loaded: production ran the package copy while the unit
  // test drove the app one, and a test that compared the two had to keep them
  // in step. The app copy is gone and tests/oauth2ClientSecretJwt.test.cjs
  // drives the package file. Negative: no copy comes back anywhere in the tree.
  const { execFileSync } = require('child_process');
  const copies = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT })
    .toString().split('\n')
    .filter(f => /(^|\/)oauth2ClientSecretJwt\.(js|cjs|mjs)$/.test(f) && !f.startsWith('_build')
      && fs.existsSync(path.join(ROOT, f)));
  assert.deepStrictEqual(copies, ['packages/wekan-oidc/oauth2ClientSecretJwt.js']);
  const test = fs.readFileSync(path.join(ROOT, 'tests', 'oauth2ClientSecretJwt.test.cjs'), 'utf8');
  assert.ok(test.includes("require('../packages/wekan-oidc/oauth2ClientSecretJwt')"),
    'the unit test drives the file production runs');
});

console.log(`\npackageAppImportBoundary: ${passed} tests passed`);
