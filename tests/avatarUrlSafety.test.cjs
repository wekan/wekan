'use strict';

// Plain-Node unit test (no Meteor) for the avatar-URL classification and SSRF address
// checks used when localizing external avatars into files/avatars.
// Run: node tests/avatarUrlSafety.test.cjs

const assert = require('assert');
const {
  isExternalAvatarUrl,
  isBlockedIp,
  decodeDataUri,
  checkUrlHostSync,
} = require('../models/lib/avatarUrlSafety');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ── isExternalAvatarUrl ──────────────────────────────────────────────────────
test('external: http and https URLs are external', () => {
  assert.strictEqual(isExternalAvatarUrl('http://example.com/a.png'), true);
  assert.strictEqual(isExternalAvatarUrl('https://gravatar.com/avatar/abc'), true);
});
test('external: data: URIs are external (self-contained)', () => {
  assert.strictEqual(isExternalAvatarUrl('data:image/png;base64,AAAA'), true);
});
// negatives
test('not external: already-local WeKan avatar URLs', () => {
  assert.strictEqual(isExternalAvatarUrl('/cdn/storage/avatars/abc123'), false);
  assert.strictEqual(isExternalAvatarUrl('http://host/cdn/storage/avatars/abc'), false);
  assert.strictEqual(isExternalAvatarUrl('/cfs/files/avatars/abc'), false);
});
test('not external: empty, non-string, and non-http(s) schemes', () => {
  assert.strictEqual(isExternalAvatarUrl(''), false);
  assert.strictEqual(isExternalAvatarUrl(null), false);
  assert.strictEqual(isExternalAvatarUrl(undefined), false);
  assert.strictEqual(isExternalAvatarUrl(12345), false);
  assert.strictEqual(isExternalAvatarUrl('ftp://host/a.png'), false);
  assert.strictEqual(isExternalAvatarUrl('/relative/path.png'), false);
  assert.strictEqual(isExternalAvatarUrl('javascript:alert(1)'), false);
});

// ── isBlockedIp (SSRF) ───────────────────────────────────────────────────────
test('blocked: IPv4 private / loopback / link-local / CGNAT / metadata / multicast', () => {
  ['127.0.0.1', '10.0.0.5', '192.168.1.1', '172.16.0.1', '172.31.255.255',
   '169.254.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '239.1.2.3']
    .forEach(ip => assert.strictEqual(isBlockedIp(ip), true, `${ip} must be blocked`));
});
test('blocked: IPv6 loopback / link-local / unique-local / mapped-private', () => {
  ['::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']
    .forEach(ip => assert.strictEqual(isBlockedIp(ip), true, `${ip} must be blocked`));
});
test('blocked: anything that is not a valid IP', () => {
  assert.strictEqual(isBlockedIp('not-an-ip'), true);
  assert.strictEqual(isBlockedIp(''), true);
});
// negatives — genuinely public addresses must NOT be blocked
test('allowed: public IPv4 addresses (incl. near-miss ranges)', () => {
  ['8.8.8.8', '1.1.1.1', '11.0.0.1', '172.15.0.1', '172.32.0.1', '192.167.0.1',
   '100.63.255.255', '100.128.0.1', '223.255.255.255']
    .forEach(ip => assert.strictEqual(isBlockedIp(ip), false, `${ip} must be allowed`));
});
test('allowed: public IPv6 addresses', () => {
  ['2001:4860:4860::8888', '::ffff:8.8.8.8']
    .forEach(ip => assert.strictEqual(isBlockedIp(ip), false, `${ip} must be allowed`));
});

// ── decodeDataUri ────────────────────────────────────────────────────────────
test('decodeDataUri: base64 payload decodes to the right bytes and type', () => {
  const { buffer, type } = decodeDataUri('data:image/png;base64,' + Buffer.from('hello').toString('base64'));
  assert.strictEqual(type, 'image/png');
  assert.strictEqual(buffer.toString('utf8'), 'hello');
});
test('decodeDataUri: non-base64 (url-encoded) payload decodes', () => {
  const { buffer } = decodeDataUri('data:text/plain,hello%20world');
  assert.strictEqual(buffer.toString('utf8'), 'hello world');
});
test('decodeDataUri: malformed URI throws', () => {
  assert.throws(() => decodeDataUri('data:image/png'), /invalid data URI/);
});

// ── checkUrlHostSync (SSRF, sync part) ───────────────────────────────────────
test('checkUrlHostSync: public hostname needs a DNS check', () => {
  const r = checkUrlHostSync('https://example.com/a.png');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.needsDnsCheck, true);
  assert.strictEqual(r.host, 'example.com');
});
test('checkUrlHostSync: public IP literal is allowed without DNS', () => {
  const r = checkUrlHostSync('http://8.8.8.8/a.png');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.needsDnsCheck, false);
});
// negatives — the SSRF-relevant rejections
test('checkUrlHostSync: rejects non-http(s) protocols', () => {
  assert.strictEqual(checkUrlHostSync('ftp://host/a').ok, false);
  assert.strictEqual(checkUrlHostSync('file:///etc/passwd').ok, false);
  assert.strictEqual(checkUrlHostSync('gopher://host').ok, false);
});
test('checkUrlHostSync: rejects localhost and private/metadata IP literals', () => {
  assert.strictEqual(checkUrlHostSync('http://localhost/a').ok, false);
  assert.strictEqual(checkUrlHostSync('http://sub.localhost/a').ok, false);
  assert.strictEqual(checkUrlHostSync('http://127.0.0.1/a').ok, false);
  assert.strictEqual(checkUrlHostSync('http://169.254.169.254/latest/meta-data').ok, false);
  assert.strictEqual(checkUrlHostSync('http://[::1]/a').ok, false);
  assert.strictEqual(checkUrlHostSync('http://192.168.0.10/a').ok, false);
});
test('checkUrlHostSync: rejects a malformed URL', () => {
  assert.strictEqual(checkUrlHostSync('not a url').ok, false);
});

console.log(`\navatarUrlSafety: ${passed} tests passed`);
