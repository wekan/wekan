'use strict';

// Plain-Node unit test (no Meteor) for the LDAP photo (jpegPhoto/thumbnailPhoto) buffer
// extraction. Run: node tests/ldapPhoto.test.cjs

const assert = require('assert');
const { getLdapPhotoBuffer } = require('../packages/wekan-ldap/server/ldapPhoto');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

// ── positive: the various shapes ldapjs can produce ──────────────────────────
test('reads a Buffer jpegPhoto from _raw', () => {
  const out = getLdapPhotoBuffer({ _raw: { jpegPhoto: png } });
  assert.ok(Buffer.isBuffer(out) && out.equals(png));
});
test('reads a Buffer jpegPhoto from the entry itself (no _raw)', () => {
  const out = getLdapPhotoBuffer({ jpegPhoto: png });
  assert.ok(out && out.equals(png));
});
test('reads the first element of an array of Buffers', () => {
  const out = getLdapPhotoBuffer({ _raw: { jpegPhoto: [png, Buffer.from('second')] } });
  assert.ok(out && out.equals(png));
});
test('reads a serialized { type:"Buffer", data:[…] }', () => {
  const out = getLdapPhotoBuffer({ _raw: { jpegPhoto: { type: 'Buffer', data: Array.from(png) } } });
  assert.ok(out && out.equals(png));
});
test('reads a long base64 string', () => {
  const b64 = png.toString('base64').repeat(8); // > 32 chars
  const out = getLdapPhotoBuffer({ _raw: { jpegPhoto: b64 } });
  assert.ok(Buffer.isBuffer(out) && out.length > 0);
});
test('falls back to thumbnailPhoto when jpegPhoto is absent', () => {
  const out = getLdapPhotoBuffer({ _raw: { thumbnailPhoto: png } });
  assert.ok(out && out.equals(png));
});
test('prefers jpegPhoto over thumbnailPhoto', () => {
  const other = Buffer.from('thumb');
  const out = getLdapPhotoBuffer({ _raw: { jpegPhoto: png, thumbnailPhoto: other } });
  assert.ok(out && out.equals(png));
});

// ── negative: nothing usable → null, never a throw ───────────────────────────
test('returns null when there is no photo attribute', () => {
  assert.strictEqual(getLdapPhotoBuffer({ _raw: { cn: 'Alice' } }), null);
});
test('returns null for an empty / undefined / null user', () => {
  assert.strictEqual(getLdapPhotoBuffer({}), null);
  assert.strictEqual(getLdapPhotoBuffer(null), null);
  assert.strictEqual(getLdapPhotoBuffer(undefined), null);
});
test('ignores an empty array and empty values', () => {
  assert.strictEqual(getLdapPhotoBuffer({ _raw: { jpegPhoto: [] } }), null);
  assert.strictEqual(getLdapPhotoBuffer({ _raw: { jpegPhoto: '' } }), null);
  assert.strictEqual(getLdapPhotoBuffer({ _raw: { jpegPhoto: null } }), null);
});
test('ignores a too-short string (not a real base64 photo)', () => {
  assert.strictEqual(getLdapPhotoBuffer({ _raw: { jpegPhoto: 'abc' } }), null);
});

console.log(`\nldapPhoto: ${passed} tests passed`);
