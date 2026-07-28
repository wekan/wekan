'use strict';

// Plain-Node guard for the SMTP transport options and the two opt-in TLS
// switches. Run: node tests/mailTransportTls.test.cjs
//
// #6551: a mail server whose certificate does not match the name it is reached by
// ("Hostname/IP doesn't match certificate's altnames") could not be used at all,
// because Meteor builds its transport from MAIL_URL and offers no way to say
// "connect anyway".
//
// #6553: the same for an outgoing webhook to a server with a self-signed
// certificate - it failed at the TLS handshake with no way around it.
//
// Both are OFF by default, both are per-install, and neither is
// NODE_TLS_REJECT_UNAUTHORIZED=0, which would drop certificate checking for
// everything the server connects to.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// The module is an ES module; load its pure parts without a bundler.
const src = read('server/lib/mailTransport.js');
const lib = {};
// eslint-disable-next-line no-new-func
new Function('exports', 'URL', src.replace(/export function/g, 'function') +
  '\nexports.smtpOptionsFromUrl = smtpOptionsFromUrl;' +
  '\nexports.tlsVerificationDisabled = tlsVerificationDisabled;' +
  '\nexports.installMailTransport = installMailTransport;')(lib, URL);

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

test('certificate checking is ON unless it is turned off explicitly', () => {
  assert.strictEqual(lib.smtpOptionsFromUrl('smtp://mail/').tls.rejectUnauthorized, true);
  assert.strictEqual(
    lib.smtpOptionsFromUrl('smtp://mail/', { rejectUnauthorized: false })
      .tls.rejectUnauthorized, false);

  for (const value of [undefined, '', 'true', 'TRUE', '0', 'no', 'yes']) {
    assert.strictEqual(lib.tlsVerificationDisabled({ MAIL_TLS_REJECT_UNAUTHORIZED: value }),
      false, `${JSON.stringify(value)} must not disable verification`);
  }
  for (const value of ['false', 'False', 'FALSE']) {
    assert.strictEqual(lib.tlsVerificationDisabled({ MAIL_TLS_REJECT_UNAUTHORIZED: value }),
      true, `${JSON.stringify(value)} disables it`);
  }
});

test('nothing is installed unless it was asked for, and it can be', () => {
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

  // Asked for, but nothing to connect to.
  assert.strictEqual(
    lib.installMailTransport({ Email, EmailInternals,
      env: { MAIL_TLS_REJECT_UNAUTHORIZED: 'false' } }),
    'no-mail-url');

  // Asked for.
  assert.strictEqual(
    lib.installMailTransport({ Email, EmailInternals,
      env: { MAIL_TLS_REJECT_UNAUTHORIZED: 'false', MAIL_URL: 'smtp://mail.example.com:587/' } }),
    'insecure-tls');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].tls.rejectUnauthorized, false);
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
    env: { MAIL_TLS_REJECT_UNAUTHORIZED: 'false', MAIL_URL: 'smtp://mail/' },
  });

  Email.customTransport({ packageSettings: { x: 1 }, from: 'a@b', to: 'c@d', subject: 's' });
  assert.deepStrictEqual(sent, [{ from: 'a@b', to: 'c@d', subject: 's' }],
    'packageSettings is Meteor\'s, not a message field');
});

test('the webhook switch is separate, opt-in, and does not touch the SSRF guard', () => {
  const guard = read('server/lib/ssrfGuard.js');
  assert.ok(/process\.env\.WEBHOOK_TLS_REJECT_UNAUTHORIZED === 'false'/.test(guard),
    'exact string comparison: only "false" turns it off');
  assert.ok(/reqOptions\.rejectUnauthorized = false;/.test(guard));
  // It applies to HTTPS only, and the address pinning stays.
  const at = guard.indexOf('WEBHOOK_TLS_REJECT_UNAUTHORIZED');
  const httpsBlock = guard.lastIndexOf('if (isHttps) {', at);
  assert.ok(httpsBlock !== -1 && httpsBlock < at, 'inside the isHttps branch');
  assert.ok(/hostname: resolvedIp,/.test(guard), 'the connection is still pinned to the resolved IP');
  assert.ok(/SSRF_GUARD: Blocked IP in URL/.test(guard), 'and private addresses are still refused');

  // Never the global switch - checked on the CODE, because both files NAME it in
  // a comment to say that is exactly what they do not do.
  for (const file of ['server/lib/ssrfGuard.js', 'server/lib/mailTransport.js']) {
    const code = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/NODE_TLS_REJECT_UNAUTHORIZED/.test(code),
      `${file} must not disable verification process-wide`);
  }
});

console.log(`\n${passed} tests passed`);
