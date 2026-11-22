'use strict';

// models/lib/cloudAddresses.js: Admin Panel / Cloud / Allowed addresses - the
// IPv4 and IPv6 addresses and CIDR ranges a Cloud Admin may sign in from.
// Run: node tests/cloudAddresses.test.cjs

const assert = require('node:assert/strict');
const A = require('../models/lib/cloudAddresses.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('addresses are read the way a socket reports them', () => {
  const shown = v => { const p = A.parseAddress(v); return p && `${p.version}:${A.formatAddress(p)}`; };
  assert.equal(shown('203.0.113.7'), '4:203.0.113.7');
  assert.equal(shown('::ffff:203.0.113.7'), '4:203.0.113.7', 'an IPv4 client of a dual-stack socket is that IPv4 address');
  assert.equal(shown('2001:DB8:0:0:0:0:0:1'), '6:2001:db8::1');
  assert.equal(shown('[2001:db8::5]'), '6:2001:db8::5');
  assert.equal(shown('fe80::1%eth0'), '6:fe80::1');
  assert.equal(shown('::1'), '6:::1');
  for (const bad of ['', 'unknown', '1.2.3', '1.2.3.4.5', '01.2.3.4', '256.1.1.1', '1::2::3', '1:2:3:4:5:6:7:8:9', 'g::1', null, 7]) {
    assert.equal(A.parseAddress(bad), null, `negative: ${bad} is no address`);
  }
});

test('the list: canonical, without duplicates, ranges with their host bits cleared', () => {
  assert.deepEqual(A.normalizeAllowedAddresses('203.0.113.7/24, 2001:DB8::7/32\n198.51.100.1 198.51.100.1;::ffff:192.0.2.1'),
    ['203.0.113.0/24', '2001:db8::/32', '198.51.100.1', '192.0.2.1']);
  assert.deepEqual(A.normalizeAllowedAddresses(''), []);
  assert.deepEqual(A.normalizeAllowedAddresses(['10.0.0.0/8']), ['10.0.0.0/8']);
  for (const bad of ['1.2.3.4/33', '2001:db8::/129', 'example.com', '1.2.3.4/x', '1.2.3.4/8/8', '::ffff:1.2.3.4/120']) {
    assert.throws(() => A.normalizeAllowedAddresses(bad), /Not an address or a range/, `negative: ${bad}`);
  }
  assert.throws(() => A.normalizeAllowedAddresses(Array.from({ length: 201 }, (_, i) => `10.0.${Math.floor(i / 256)}.${i % 256}`)), /At most 200/);
  assert.throws(() => A.normalizeAllowedAddresses([{ $ne: 1 }]), /Expected addresses/);
});

test('a Cloud Admin from an allowed address may sign in; from any other, never', () => {
  const list = ['203.0.113.0/24', '2001:db8::/32', '198.51.100.7'];
  assert.equal(A.addressAllowed('203.0.113.200', list), true);
  assert.equal(A.addressAllowed('::ffff:203.0.113.9', list), true);
  assert.equal(A.addressAllowed('2001:db8:1::1', list), true);
  assert.equal(A.addressAllowed('198.51.100.7', list), true);
  assert.equal(A.addressAllowed('203.0.114.1', list), false, 'negative: outside the range');
  assert.equal(A.addressAllowed('198.51.100.8', list), false, 'negative: next to the one address');
  assert.equal(A.addressAllowed('2001:db9::1', list), false, 'negative: another IPv6 network');
  assert.equal(A.addressAllowed('unknown', list), false, 'negative: an address that cannot be read is refused, not let through');
  assert.equal(A.addressAllowed('', list), false);
  assert.equal(A.addressAllowed('::203.0.113.9', list), false, 'negative: an IPv4-compatible IPv6 address is not the IPv4 one');
  assert.equal(A.addressAllowed('0.0.0.0', ['0.0.0.0/0']), true, 'a /0 is everything of its family');
  assert.equal(A.addressAllowed('2001:db8::1', ['0.0.0.0/0']), false, 'negative: and nothing of the other');
});

test('an empty list is any address', () => {
  assert.equal(A.addressAllowed('203.0.113.1', []), true);
  assert.equal(A.addressAllowed('unknown', []), true);
  assert.equal(A.addressAllowed('203.0.113.1', undefined), true);
});

console.log(`\ncloudAddresses: ${passed} tests passed`);
