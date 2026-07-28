'use strict';

// Plain-Node guard for the SMTP transport options and the two opt-in TLS
// switches. Run: node tests/mailTransportTls.test.cjs
//
// #6551: a mail server whose certificate does not match the name it is reached by
// ("Hostname/IP doesn't match certificate's altnames") could not be used at all,
// because Meteor builds its transport from MAIL_URL and offers no way to say
// anything about it. #6553: the same for an outgoing webhook to a server with a
// self-signed certificate.
//
// The first answer was `rejectUnauthorized: false`, which accepts ANY certificate
// - including one a man in the middle presents - and is what the handshake exists
// to prevent (CodeQL js/disabling-certificate-validation, alert #430). It is gone,
// and these tests are what keeps it gone.
//
// What replaced it says what is actually true about the server and keeps
// verification ON: the certificate to TRUST (a self-signed certificate is its own
// issuer) and, for mail, the name to verify AGAINST.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// The module is an ES module; load its pure parts without a bundler.
const src = read('server/lib/mailTransport.js');
const lib = {};
// eslint-disable-next-line no-new-func
new Function('exports', 'URL', 'fs',
  src.replace(/export function/g, 'function').replace(/^import .*$/gm, '') +
  '\nexports.smtpOptionsFromUrl = smtpOptionsFromUrl;' +
  '\nexports.hasTlsOverrides = hasTlsOverrides;' +
  '\nexports.certificateFrom = certificateFrom;' +
  '\nexports.installMailTransport = installMailTransport;')(lib, URL, fs);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('mailTransportTls:');

test('a MAIL_URL becomes the SMTP options Meteor would have used', () => {
  const plain = lib.smtpOptionsFromUrl('smtp://mail.example.com:25/');
  assert.strictEqual(plain.host, 'mail.example.com');
  assert.strictEqual(plain.port, 25);
  assert.strictEqual(plain.secure, false);
  assert.strictEqual(plain.pool, true);
  assert.strictEqual(plain.auth, undefined, 'no credentials, no auth block');

  const secure = lib.smtpOptionsFromUrl('smtps://mail.example.com/');
  assert.strictEqual(secure.secure, true);
  assert.strictEqual(secure.port, 465, 'implicit TLS defaults to 465');

  const submission = lib.smtpOptionsFromUrl('smtp://mail.example.com/');
  assert.strictEqual(submission.port, 587, 'STARTTLS defaults to the submission port');
});

test('credentials survive the characters that need encoding', () => {
  const opts = lib.smtpOptionsFromUrl(
    'smtp://user%40example.com:p%40ss%3Aword@mail.example.com:587/');
  assert.deepStrictEqual(opts.auth, {
    user: 'user@example.com',
    pass: 'p@ss:word',
  });
});

test('a URL that is not SMTP is refused, not half-configured', () => {
  assert.throws(() => lib.smtpOptionsFromUrl('http://mail.example.com/'),
    /must be smtp: or smtps:/);
});

test('certificate checking is ON, always, and cannot be turned off', () => {
  assert.strictEqual(lib.smtpOptionsFromUrl('smtp://mail/').tls.rejectUnauthorized, true);
  assert.strictEqual(
    lib.smtpOptionsFromUrl('smtp://mail/', { ca: 'PEM', servername: 'mail.example.com' })
      .tls.rejectUnauthorized, true,
    'supplying a certificate or a name does not switch verification off');

  // The source may not contain the pattern at all, in either file.
  for (const file of ['server/lib/mailTransport.js', 'server/lib/ssrfGuard.js']) {
    const code = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/rejectUnauthorized:\s*false/.test(code),
      `${file}: rejectUnauthorized: false accepts any certificate`);
    assert.ok(!/rejectUnauthorized\s*=\s*false/.test(code), `${file}: same, as an assignment`);
    assert.ok(!/NODE_TLS_REJECT_UNAUTHORIZED/.test(code),
      `${file} must not disable verification process-wide`);
  }
});

test('what the operator supplies is a certificate, or a name to check against', () => {
  const withCa = lib.smtpOptionsFromUrl('smtp://mail/', { ca: '-----BEGIN CERTIFICATE-----x' });
  assert.strictEqual(withCa.tls.ca, '-----BEGIN CERTIFICATE-----x',
    'the certificate to trust - a self-signed one is its own issuer');
  const withName = lib.smtpOptionsFromUrl('smtp://mail/', { servername: 'mail.example.com' });
  assert.strictEqual(withName.tls.servername, 'mail.example.com',
    'the name the certificate is verified against');

  // Nothing supplied, nothing added.
  const plain = lib.smtpOptionsFromUrl('smtp://mail/');
  assert.strictEqual(plain.tls.ca, undefined);
  assert.strictEqual(plain.tls.servername, undefined);
});

test('a certificate can be the PEM itself or a path, and a bad path is not fatal', () => {
  const pem = '-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----';
  assert.strictEqual(lib.certificateFrom(pem), pem, 'the PEM as-is');

  const read = (p, enc) => {
    assert.strictEqual(enc, 'utf8');
    if (p === '/etc/wekan/ca.pem') return pem;
    throw new Error('ENOENT');
  };
  assert.strictEqual(lib.certificateFrom('/etc/wekan/ca.pem', { readFile: read }), pem,
    'or a path to it');

  const errors = [];
  const original = console.error;
  console.error = message => errors.push(message);
  try {
    assert.strictEqual(lib.certificateFrom('/nope.pem', { readFile: read, name: 'MAIL_TLS_CA_CERT' }),
      null, 'a bad path leaves the system trust store in place');
  } finally {
    console.error = original;
  }
  assert.ok(errors.length === 1 && /MAIL_TLS_CA_CERT/.test(errors[0]),
    'and says which setting could not be read');

  assert.strictEqual(lib.certificateFrom(''), null);
  assert.strictEqual(lib.certificateFrom(undefined), null);
});

test('nothing is installed unless there is something to say, and then it is', () => {
  const calls = [];
  const nodemailer = {
    createTransport(options) {
      calls.push(options);
      return { sendMail: () => Promise.resolve('sent') };
    },
  };
  const Email = {};
  const EmailInternals = { NpmModules: { nodemailer: { module: nodemailer } } };

  // Default: untouched.
  assert.strictEqual(
    lib.installMailTransport({ Email, EmailInternals, env: { MAIL_URL: 'smtp://mail/' } }),
    'default');
  assert.strictEqual(Email.customTransport, undefined);
  assert.strictEqual(calls.length, 0);

  // Something to say, but nothing to connect to.
  assert.strictEqual(
    lib.installMailTransport({ Email, EmailInternals,
      env: { MAIL_TLS_SERVERNAME: 'mail.example.com' } }),
    'no-mail-url');

  // Both present.
  assert.strictEqual(
    lib.installMailTransport({ Email, EmailInternals,
      env: { MAIL_TLS_SERVERNAME: 'mail.example.com', MAIL_URL: 'smtp://mail.example.com:587/' } }),
    'custom-tls');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].tls.rejectUnauthorized, true, 'still verified');
  assert.strictEqual(calls[0].tls.servername, 'mail.example.com');
  assert.strictEqual(typeof Email.customTransport, 'function');
});

test("the message reaches nodemailer without Meteor's own key", () => {
  const sent = [];
  const nodemailer = {
    createTransport: () => ({ sendMail: message => { sent.push(message); return Promise.resolve(); } }),
  };
  const Email = {};
  lib.installMailTransport({
    Email,
    EmailInternals: { NpmModules: { nodemailer: { module: nodemailer } } },
    env: { MAIL_TLS_SERVERNAME: 'mail.example.com', MAIL_URL: 'smtp://mail/' },
  });

  Email.customTransport({ packageSettings: { x: 1 }, from: 'a@b', to: 'c@d', subject: 's' });
  assert.deepStrictEqual(sent, [{ from: 'a@b', to: 'c@d', subject: 's' }],
    'packageSettings is Meteor\'s, not a message field');
});

test('the webhook side trusts a certificate, and keeps every SSRF protection', () => {
  const guard = read('server/lib/ssrfGuard.js');
  assert.ok(/WEBHOOK_TLS_CA_CERT/.test(guard), 'the certificate to trust comes from the operator');
  assert.ok(/reqOptions\.ca = ca;/.test(guard), 'and is handed to the TLS layer');

  // It applies to HTTPS only, and the address pinning stays.
  const at = guard.indexOf('const ca = webhookCaCert();');
  assert.notStrictEqual(at, -1, 'the certificate is read where the request is built');
  const httpsBlock = guard.lastIndexOf('if (isHttps) {', at);
  assert.ok(httpsBlock !== -1 && httpsBlock < at, 'inside the isHttps branch');
  assert.ok(/hostname: resolvedIp,/.test(guard), 'the connection is still pinned to the resolved IP');
  assert.ok(/SSRF_GUARD: Blocked IP in URL/.test(guard), 'and private addresses are still refused');
  assert.ok(/reqOptions\.servername = hostname;/.test(guard),
    'the certificate is still checked against the host that was asked for');
});

console.log(`\n${passed} tests passed`);
