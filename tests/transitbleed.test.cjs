'use strict';

// TransitBleed — IPv6 transition addresses walked straight through the SSRF
// block-list (GHSA-c5xr-mg26-vq5w, reported by tonghuaroot).
// Run: node tests/transitbleed.test.cjs
//
// isIpBlocked() in models/lib/attachmentUrlValidation.js is the ONE block-list
// behind both halves of the SSRF defence — the input-time validator
// (validateAttachmentUrl, used by attachment URLs, webhooks and every import
// path) and the delivery-time guard (fetchSafe / server/lib/ssrfGuard.js). Its
// IPv6 half classified an address by its SPELLING: startsWith('::ffff:'),
// startsWith('2001:db8'), and the first hextet parsed out of the string.
//
// IPv6 has several standard ways to write "this packet goes to an IPv4
// address", and none of them looks like `::ffff:`:
//
//   2002:a9fe:a9fe::      6to4 (RFC 3056)      → 169.254.169.254
//   64:ff9b::c0a8:101     NAT64 (RFC 6052)     → 192.168.1.1
//   2001:0:…              Teredo (RFC 4380)    → complement of the low 32 bits
//   0:0:0:0:0:ffff:7f00:1 IPv4-mapped, spelled out → 127.0.0.1
//
// On a host with a 6to4 relay or a NAT64 gateway — ordinary in cloud and
// Kubernetes networks — the packet arrives at that IPv4 address. So
// http://[2002:a9fe:a9fe::]/latest/meta-data/ read cloud metadata through the
// guard whose whole job was to stop it.
//
// The fix expands the address to its 16 bytes ONCE and reads those bytes, so
// notation cannot change the answer, and extracts the embedded IPv4 from every
// transition form to re-check it with the IPv4 rules. These tests pin both: the
// bypasses are blocked, and public IPv6 — including a legitimate 6to4 or NAT64
// address wrapping a public IPv4 — is still reachable, because a guard that
// blocks everything gets switched off.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// The validator is an ES module that imports meteor/meteor; load it without a
// bundler, as the other plain-node guards do.
const src = read('models/lib/attachmentUrlValidation.js')
  .replace(/^import [^\n]*\n/gm, '')
  .replace(/^export (async function|function)/gm, '$1');
const lib = {};
// eslint-disable-next-line no-new-func
new Function('exports', 'Meteor', 'require', `${src}\nexports.isIpBlocked = isIpBlocked;`)(
  lib,
  { isServer: true },
  require,
);

const blocked = (ip, why) =>
  assert.strictEqual(lib.isIpBlocked(ip), true, `${ip} must be blocked (${why})`);
const allowed = (ip, why) =>
  assert.strictEqual(lib.isIpBlocked(ip), false, `${ip} must be allowed (${why})`);

console.log('transitbleed:');

// ── The reported bypasses ────────────────────────────────────────────────────

test('6to4 (2002::/16) carrying a blocked IPv4 is blocked', () => {
  blocked('2002:a9fe:a9fe::', 'the report\'s payload → 169.254.169.254 metadata');
  blocked('2002:7f00:0001::', '→ 127.0.0.1');
  blocked('2002:0a00:0001::', '→ 10.0.0.1');
  blocked('2002:c0a8:0101::', '→ 192.168.1.1');
  blocked('2002:ac10:0001::', '→ 172.16.0.1');
  // the embedded IPv4 decides, wherever the rest of the address points
  blocked('2002:7f00:1:1:2:3:4:5', '→ 127.0.0.1 with a full interface id');
});

test('NAT64 (64:ff9b::/96) carrying a blocked IPv4 is blocked', () => {
  blocked('64:ff9b::a9fe:a9fe', 'the report\'s payload → 169.254.169.254');
  blocked('64:ff9b::c0a8:101', '→ 192.168.1.1');
  blocked('64:ff9b::7f00:1', '→ 127.0.0.1');
  blocked('64:ff9b::192.168.1.1', 'same address, dotted-quad notation');
  blocked('64:ff9b:1:fffe::a9fe:a9fe', 'the RFC 8215 local-use NAT64 prefix');
});

test('Teredo (2001:0000::/32) is blocked through either embedded IPv4', () => {
  // The client IPv4 is stored as its bitwise complement: 169.254.169.254 is
  // ~a9fe:a9fe = 5601:5601.
  blocked('2001:0:5ef5:79fd:0:0:5601:5601', 'client → 169.254.169.254');
  blocked('2001:0:a00:1::1', 'Teredo server → 10.0.0.1');
});

test('an IPv4-mapped address is blocked however it is SPELLED', () => {
  blocked('::ffff:127.0.0.1', 'the form the old string check caught');
  blocked('::ffff:7f00:1', 'same address, hextet notation');
  blocked('0:0:0:0:0:ffff:7f00:1', 'same address, uncompressed — the old check missed this');
  blocked('0000:0000:0000:0000:0000:ffff:169.254.169.254', 'uncompressed, dotted');
  blocked('::ffff:0:169.254.169.254', 'IPv4-translated ::ffff:0:0:0/96');
  blocked('::169.254.169.254', 'deprecated IPv4-compatible');
});

test('ISATAP carries an IPv4 under ANY prefix, not just link-local', () => {
  blocked('fe80::5efe:10.0.0.1', 'the usual link-local ISATAP address');
  blocked('2001:4860:4860::5efe:a00:1', 'a PUBLIC prefix with an ISATAP interface id');
  blocked('2001:4860:4860::200:5efe:169.254.169.254', 'the locally-administered form');
});

// ── What was already blocked stays blocked ───────────────────────────────────

test('the ranges the guard blocked before are still blocked', () => {
  blocked('::1', 'loopback');
  blocked('::', 'unspecified');
  blocked('0:0:0:0:0:0:0:0', 'unspecified, uncompressed');
  blocked('fd00::1', 'fc00::/7 unique-local');
  blocked('fc00::1', 'fc00::/7 unique-local');
  blocked('fe80::1', 'fe80::/10 link-local');
  blocked('fe80::1%eth0', 'link-local with an interface zone');
  blocked('febf::1', 'the top of fe80::/10');
  blocked('ff02::1', 'multicast');
  blocked('2001:db8::1', 'documentation prefix');
});

test('the deprecated fec0::/10 site-local range is blocked too', () => {
  blocked('fec0::1', 'site-local is a private range by any other name');
  blocked('feff::1', 'the top of fec0::/10');
});

test('anything that is not an IPv6 address fails CLOSED', () => {
  blocked('garbage', 'not an address');
  blocked('2001:db8::1::2', 'two :: runs');
  blocked('1:2:3:4:5:6:7:8:9', 'nine groups');
  blocked('1:2:3:4:5:6:7', 'seven groups, uncompressed');
  blocked('::ffff:999.1.1.1', 'an out-of-range octet');
  blocked('::fffg:1', 'a non-hex digit');
});

// ── Public IPv6 must still be reachable ──────────────────────────────────────

test('ordinary public IPv6 addresses are allowed', () => {
  allowed('2606:4700:4700::1111', 'Cloudflare DNS');
  allowed('2001:4860:4860::8888', 'Google DNS');
  allowed('2620:fe::fe', 'Quad9');
  allowed('2a00:1450:4001:80e::200e', 'a Google frontend');
});

test('a transition address wrapping a PUBLIC IPv4 is still allowed', () => {
  allowed('2002:5db8:d822::', '6to4 around the public 93.184.216.34');
  allowed('64:ff9b::93.184.216.34', 'NAT64 around a public address');
  allowed('64:ff9b::5db8:d822', 'the same, in hextets');
  allowed('::ffff:93.184.216.34', 'IPv4-mapped public address');
});

test('an IPv4 address is still classified by the IPv4 rules', () => {
  blocked('127.0.0.1', 'loopback');
  blocked('169.254.169.254', 'cloud metadata');
  blocked('10.0.0.1', 'RFC 1918');
  blocked('192.168.1.1', 'RFC 1918');
  blocked('172.16.0.1', 'RFC 1918');
  allowed('93.184.216.34', 'a public address');
});

// ── The one block-list stays the one block-list ──────────────────────────────

test('the delivery-time guard still delegates to this same block-list', () => {
  const guard = read('server/lib/ssrfGuard.js');
  assert.ok(
    /import \{ isIpBlocked \} from '\/models\/lib\/attachmentUrlValidation'/.test(guard),
    'ssrfGuard must classify IPs with the shared isIpBlocked, not a private copy',
  );
  assert.ok(
    !/\b(10\.0\.0\.0|192\.168\.0\.0)\b/.test(guard),
    'no second range list may grow back inside the delivery-time guard',
  );
});

console.log(`\ntransitbleed: ${passed} checks passed`);
