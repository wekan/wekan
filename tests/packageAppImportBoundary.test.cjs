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
// at boot. The fix was to vendor the small pure pieces a package needs
// (packages/wekan-ldap/server/configResolver.js) and inject anything
// stateful (Settings access) from the app side via a setter
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
  assert.ok(/from ['"]\.\/configResolver['"]/.test(src),
    'it must use the vendored package-local copy instead');
  assert.ok(/export function setLdapSettingsAccessor/.test(src),
    'Settings access must be injected by the app, not imported by the package');
});

test('the vendored packages/wekan-ldap/server/configResolver.js stays behaviourally in sync '
  + 'with models/lib/configResolver.js', () => {
  const appPath = path.join(ROOT, 'models', 'lib', 'configResolver.js');
  const pkgPath = path.join(PACKAGES_DIR, 'wekan-ldap', 'server', 'configResolver.js');
  delete require.cache[require.resolve(appPath)];
  const app = require(appPath);

  // The package copy is a real ES module (import/export), so it cannot be
  // require()'d directly by this CommonJS test the way the app copy can;
  // compare their resolveConfigValue/hasConfigValue FUNCTION BODIES instead,
  // which is exactly what would drift if only one copy were edited.
  const pkgSrc = fs.readFileSync(pkgPath, 'utf8');
  for (const name of ['resolveConfigValue', 'hasConfigValue']) {
    assert.ok(typeof app[name] === 'function', `models/lib/configResolver.js exports ${name}`);
    const appBody = app[name].toString().replace(/\s+/g, ' ').trim();
    const pkgFn = new RegExp(`function ${name}\\(([^)]*)\\) \\{([\\s\\S]*?)\\n\\}`).exec(pkgSrc);
    assert.ok(pkgFn, `packages/wekan-ldap/server/configResolver.js defines ${name}`);
    const pkgBody = `function ${name}(${pkgFn[1]}) {${pkgFn[2]}\n}`.replace(/\s+/g, ' ').trim();
    assert.strictEqual(pkgBody, appBody,
      `${name}'s vendored copy in packages/wekan-ldap has drifted from models/lib/configResolver.js - `
      + 'keep both edits together');
  }
});

test('wekan-oidc/oidc_server.js no longer imports the app oauth2ClientSecretJwt module', () => {
  const src = fs.readFileSync(
    path.join(PACKAGES_DIR, 'wekan-oidc', 'oidc_server.js'), 'utf8');
  assert.ok(!/require\(['"]\/models\/lib\/oauth2ClientSecretJwt['"]\)/.test(src));
  assert.ok(/require\(['"]\.\/oauth2ClientSecretJwt['"]\)/.test(src),
    'it must use the vendored package-local copy instead');
});

test('the vendored packages/wekan-oidc/oauth2ClientSecretJwt.js behaves identically to '
  + 'models/lib/oauth2ClientSecretJwt.js', () => {
  const app = require(path.join(ROOT, 'models', 'lib', 'oauth2ClientSecretJwt.js'));
  const pkg = require(path.join(PACKAGES_DIR, 'wekan-oidc', 'oauth2ClientSecretJwt.js'));

  const crypto = require('crypto');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const claims = {
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    keyId: 'kid-1',
    issuer: 'TEAM123',
    subject: 'com.example.service',
    audience: 'https://appleid.apple.com',
    now: 1700000000,
    expiresInSeconds: 300,
  };
  // ES256 signing is randomized (a fresh nonce each call), so the two JWTs
  // are never byte-identical even for identical input; compare the header.
  // payload they each committed to, and confirm each copy produced a
  // signature that actually verifies against the same public key.
  const appJwt = app.generateClientSecretJwt(claims);
  const pkgJwt = pkg.generateClientSecretJwt(claims);
  const [appHeaderPayload] = [appJwt.split('.').slice(0, 2).join('.')];
  const [pkgHeaderPayload] = [pkgJwt.split('.').slice(0, 2).join('.')];
  assert.strictEqual(pkgHeaderPayload, appHeaderPayload,
    'both copies must commit to the same header+claims for identical input - keep both edits together');
  for (const jwt of [appJwt, pkgJwt]) {
    const [headerPayload, sig] = [jwt.split('.').slice(0, 2).join('.'), jwt.split('.')[2]];
    const signature = Buffer.from(sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    assert.ok(crypto.verify('sha256', Buffer.from(headerPayload), {
      key: publicKey, dsaEncoding: 'ieee-p1363',
    }, signature), 'the signature must verify against the public key');
  }

  assert.strictEqual(
    pkg.maybeGenerateOauth2ClientSecretJwt({}, 'client-id'),
    app.maybeGenerateOauth2ClientSecretJwt({}, 'client-id'),
    'both return null the same way when unconfigured');
});

console.log(`\npackageAppImportBoundary: ${passed} tests passed`);
