'use strict';

// Admin Panel / Problems / Offices groups successful-login addresses by person.
// Run: node tests/officesGroupedByPerson.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === './ipAddress') {
    return { classifyAddress: value => ({
      ipv4: String(value).includes('.') ? value : '',
      ipv6: String(value).includes(':') ? value : '',
    }) };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const { officeRowsByPerson } = require('../models/lib/loginTally');
Module._load = originalLoad;
const { locationFromHeaders, officeLabel } = require('../models/lib/geoHeaders');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('officesGroupedByPerson:');

test('all addresses for one person stay adjacent with their own counts', () => {
  const rows = officeRowsByPerson([{
    userId: 'u1', username: 'alice', fullname: 'Alice Example', initials: 'AE',
    avatarUrl: '/a.png',
    addresses: [
      { ipv4: '203.0.113.4', ipv6: '', logins: 12,
        location: { country: 'FI', city: 'Helsinki' } },
      { ipv4: '', ipv6: '2001:db8::4', logins: 3,
        location: { country: 'SE', city: 'Stockholm' } },
    ],
  }]);
  assert.strictEqual(rows.length, 2);
  assert.deepStrictEqual(rows.map(row => row.username), ['alice', 'alice']);
  assert.deepStrictEqual(rows.map(row => row.initials), ['AE', 'AE']);
  assert.deepStrictEqual(rows.map(row => row.logins), [12, 3]);
  assert.deepStrictEqual(rows.map(row => row.location.city), ['Helsinki', 'Stockholm']);
  assert.strictEqual(rows[0].ipv4, '203.0.113.4');
  assert.strictEqual(rows[1].ipv6, '2001:db8::4');
});

test('different people never merge merely because they share an address', () => {
  const address = { ipv4: '198.51.100.7', ipv6: '', logins: 1 };
  const rows = officeRowsByPerson([
    { userId: 'u1', username: 'alice', addresses: [address] },
    { userId: 'u2', username: 'bob', addresses: [{ ...address, logins: 9 }] },
  ]);
  assert.deepStrictEqual(rows.map(row => [row.username, row.logins]),
    [['alice', 1], ['bob', 9]]);
});

test('Cloudflare and generic proxy headers provide the country flag and city', () => {
  const cloudflare = locationFromHeaders({
    'cf-ipcountry': 'FI',
    'cf-ipcity': 'Helsinki',
    'cf-iplatitude': '60.1699',
    'cf-iplongitude': '24.9384',
  });
  assert.deepStrictEqual(officeLabel(cloudflare), { flag: '🇫🇮', text: 'Helsinki' });
  assert.strictEqual(cloudflare.latitude, 60.1699);

  const proxy = locationFromHeaders({
    'x-geoip-country': 'SE',
    'x-geoip-city': 'Stockholm',
  });
  assert.deepStrictEqual(officeLabel(proxy), { flag: '🇸🇪', text: 'Stockholm' });
});

test('an address without location headers remains visible without invented geography', () => {
  assert.strictEqual(locationFromHeaders({}), null);
  assert.deepStrictEqual(officeLabel(null), { flag: '', text: '' });
});

test('the report requests and renders separate IPv4 and IPv6 columns', () => {
  const source = read('client/components/settings/adminProblems.js');
  assert.ok(/labelKey: 'office-people'/.test(source));
  assert.ok(/labelKey: 'event-ipv4'/.test(source));
  assert.ok(/labelKey: 'event-ipv6'/.test(source));
  assert.ok(/officeRowsByPerson\(\(res && res\.people\)/.test(source));
  assert.ok(!/this\.rows\.set\(\(res && res\.offices\)/.test(source),
    'the UI must not fall back to address-grouped rows');
  assert.ok(/span\.table-page-person-name \{\{text\}\}/.test(
    read('client/components/settings/tablePage.jade')),
  'the person must be named visibly, not only in an avatar tooltip');
  assert.ok(/userAvatarInitials\(userId=userId initials=initials\)/.test(
    read('client/components/settings/tablePage.jade')),
  'the server-provided initials must render when the client has no user document');
});

test('the server joins proxy locations without replacing per-person counts', () => {
  const source = read('server/methods/loginOffices.js');
  assert.ok(/const addresses = tallyList\(user\.loginAddresses\)/.test(source));
  assert.ok(/location: doc\.location \|\| null/.test(source));
  assert.ok(/logins: entry\.count \|\| 0/.test(source));
  assert.ok(/initials: initialsFor\(user\)/.test(source));
  assert.ok(/return \{ total, people: await peopleSummaries\(users\) \}/.test(source));
  assert.strictEqual((source.match(/LoginAddresses\.find\(/g) || []).length, 2,
    'one search lookup and one batched page lookup are enough; do not query once per person');
});

console.log(`\nofficesGroupedByPerson: ${passed} tests passed`);
