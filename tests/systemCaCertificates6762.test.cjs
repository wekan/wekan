'use strict';

// Guard: #6762. Since v12.15 the snap verifies the LDAP server's certificate
// (LDAP_REJECT_UNAUTHORIZED defaults to true), and Node.js verified it only
// against the Mozilla list compiled into it - so a company root CA installed on
// the server with update-ca-certificates was unknown to WeKan, and LDAPS login
// failed with UNABLE_TO_VERIFY_LEAF_SIGNATURE. server/lib/systemCaCertificates.js
// adds the operating system's CAs to Node's own at startup.
//
// The TLS tests are real: a TLS server presents a certificate signed by a test
// private CA (tests/fixtures/tls6762, only its leaf, as the reporter's server
// did), and a client verifies it with rejectUnauthorized true. Each client is
// its own process, because the default CA list is process-wide.
// Run: node tests/systemCaCertificates6762.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tls = require('node:tls');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const FIX = path.join(__dirname, 'fixtures/tls6762');
const MODULE = path.join(ROOT, 'server/lib/systemCaCertificates.js');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const CA = fs.readFileSync(path.join(FIX, 'private-root-ca.pem'), 'utf8');
const { trustSystemCaCertificates, bundledCaOnly, CA_BUNDLE_FILES } = require(MODULE);
const { ldapCertificateHint } = require('../packages/wekan-ldap/server/tlsCertificateHint');

// The client: optionally trusts the system CAs (with the bundle file served
// from `bundle`, never the real /etc), then connects with verification on.
const CLIENT = `
const tls = require('node:tls');
const [modulePath, port, mode, bundle] = process.argv.slice(1);
if (mode !== 'node-only') {
  const fs = require('node:fs');
  const { trustSystemCaCertificates } = require(modulePath);
  const fakeFs = {
    existsSync: () => false,
    readFileSync: (file, enc) => {
      if (file === '/etc/ssl/certs/ca-certificates.crt' && bundle) return fs.readFileSync(bundle, enc);
      const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e;
    },
  };
  const execArgv = mode === 'bundled-only' ? ['--use-bundled-ca'] : [];
  process.stdout.write(JSON.stringify(trustSystemCaCertificates({ fs: fakeFs, env: {}, execArgv, platform: 'linux' })) + ' ');
}
const c = tls.connect({ port: +port, host: '127.0.0.1', servername: 'localhost', rejectUnauthorized: true }, () => {
  console.log('VERIFIED'); c.end();
});
c.on('error', (e) => console.log('ERROR ' + e.code));
`;

async function withServer(fn) {
  const server = tls.createServer({
    key: fs.readFileSync(path.join(FIX, 'ldap-server-key.pem')),
    cert: fs.readFileSync(path.join(FIX, 'ldap-server.pem')),
  }, (socket) => socket.end());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await fn(server.address().port);
  } finally {
    server.close();
  }
}

function client(port, mode, bundle = '') {
  return new Promise((resolve) => {
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e', CLIENT, MODULE, String(port), mode, bundle]);
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', () => resolve(out.trim()));
  });
}

const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || require('node:os').tmpdir(), 'ca6762-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
const bundleWith = path.join(tmp, 'ca-certificates.crt');
fs.writeFileSync(bundleWith, CA);
const bundleWithout = path.join(tmp, 'other.crt');
fs.writeFileSync(bundleWithout, '');

test('the reported failure: Node.js alone does not trust the private CA', async () => {
  await withServer(async (port) => {
    assert.equal(await client(port, 'node-only'), 'ERROR UNABLE_TO_VERIFY_LEAF_SIGNATURE');
  });
});

test('with the CA in the system bundle, the certificate verifies', async () => {
  await withServer(async (port) => {
    const out = await client(port, 'system', bundleWith);
    assert.match(out, /"applied":true,"added":1,/, out);
    assert.match(out, /VERIFIED$/, out);
  });
});

test('negative: verification is not relaxed - a CA the system does not have is still refused', async () => {
  await withServer(async (port) => {
    const out = await client(port, 'system', bundleWithout);
    assert.match(out, /"applied":false/, out);
    assert.match(out, /ERROR UNABLE_TO_VERIFY_LEAF_SIGNATURE$/, out);
  });
});

test('negative: --use-bundled-ca keeps Node.js\'s own list only', async () => {
  await withServer(async (port) => {
    const out = await client(port, 'bundled-only', bundleWith);
    assert.match(out, /"reason":"--use-bundled-ca"/, out);
    assert.match(out, /ERROR UNABLE_TO_VERIFY_LEAF_SIGNATURE$/, out);
  });
  assert.equal(bundledCaOnly({ NODE_OPTIONS: '--max-old-space-size=4096 --use-bundled-ca' }, []), true);
  assert.equal(bundledCaOnly({ NODE_OPTIONS: '--use-bundled-cats' }, []), false);
  assert.equal(bundledCaOnly({}, ['--use-system-ca']), false);
});

test('the bundle files read include the snap-safe Debian/Ubuntu one and the RHEL, SUSE and Alpine ones', () => {
  for (const file of ['/etc/ssl/certs/ca-certificates.crt', '/etc/pki/tls/certs/ca-bundle.crt',
    '/etc/ssl/ca-bundle.pem', '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem', '/etc/ssl/cert.pem']) {
    assert.ok(CA_BUNDLE_FILES.includes(file), file);
  }
});

test('garbage, duplicates and an old Node.js do no harm (negative)', () => {
  let set = null;
  const fakeTls = {
    getCACertificates: (kind) => (kind === 'default' ? [CA] : []),
    setDefaultCACertificates: (list) => { set = list; },
  };
  const fakeFs = {
    existsSync: () => false,
    readFileSync: () => `${CA}\n-----BEGIN CERTIFICATE-----\nnot base64 at all\n-----END CERTIFICATE-----\n${CA}`,
  };
  const r = trustSystemCaCertificates({ tls: fakeTls, fs: fakeFs, env: {}, execArgv: [], platform: 'linux' });
  assert.deepEqual(r, { applied: false, added: 0, total: 1 }, 'a CA Node already has is not added again');
  assert.equal(set, null, 'nothing to add, nothing replaced');
  const old = trustSystemCaCertificates({ tls: {}, fs: fakeFs, env: {}, execArgv: [], platform: 'linux' });
  assert.equal(old.applied, false);
});

test('the server trusts the system CAs before any application code runs', () => {
  const main = read('server/main.js');
  const at = main.indexOf('trustSystemCaCertificates()');
  assert.ok(at > 0, 'server/main.js calls trustSystemCaCertificates()');
  assert.ok(at < main.indexOf("require('/server/imports')"), 'before the application code is loaded');
  assert.match(main, /catch \(e\) \{\s*console\.warn\(`\[tls\]/, 'and a failure to read them never stops the server');
});

test('a refused certificate says what to do, and never to stop verifying', () => {
  const hint = ldapCertificateHint({ code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' });
  assert.match(hint, /update-ca-certificates/);
  assert.match(hint, /snap set wekan ldap-ca-cert=/);
  for (const code of ['SELF_SIGNED_CERT_IN_CHAIN', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'DEPTH_ZERO_SELF_SIGNED_CERT']) {
    assert.equal(ldapCertificateHint({ code }), hint, code);
  }
  assert.match(ldapCertificateHint({ code: 'ERR_TLS_CERT_ALTNAME_INVALID' }), /LDAP_HOST/);
  assert.equal(ldapCertificateHint({ code: 'ECONNREFUSED' }), '', 'not a certificate problem, no hint');
  assert.equal(ldapCertificateHint(undefined), '');
  const source = read('packages/wekan-ldap/server/tlsCertificateHint.js');
  assert.doesNotMatch(source, /REJECT_UNAUTHORIZED|reject-unauthorized|rejectUnauthorized/, 'no hint turns verification off (negative)');
  assert.match(read('packages/wekan-ldap/server/ldap.js'), /const hint = ldapCertificateHint\(error\);\s*if \(hint\) Log\.warn\(hint\);\s*throw error;/);
  assert.match(read('packages/wekan-ldap/server/testConnection.js'), /ldapCertificateHint\(error\)/);
});
