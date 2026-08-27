'use strict';

// SessionBleed (GHSA-5gcv-2hhj-7rg9): search pagination must authenticate the
// subscriber and bind the client-supplied session id to that same user.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  ownedSearchSessionSelector,
  recordLoggedOutPaginationProbe,
} = require('../models/lib/searchPaginationAuthorization');

const root = path.join(__dirname, '..');
const cards = fs.readFileSync(
  path.join(root, 'server/publications/cards.js'), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('a logged-in user can select only their own search session', () => {
  assert.deepEqual(ownedSearchSessionSelector('user-a', 'stolen-id'), {
    userId: 'user-a', sessionId: 'stolen-id',
  });
});

test('a logged-out caller gets no usable session selector (negative)', () => {
  assert.equal(ownedSearchSessionSelector(null, 'stolen-id'), null);
  assert.equal(ownedSearchSessionSelector('', 'stolen-id'), null);
});

test('logged-out pagination probes are recorded without weakening denial', () => {
  const events = [];
  assert.equal(recordLoggedOutPaginationProbe({
    userId: null, connection: { clientAddress: '192.0.2.8' },
  }, 'nextPage', event => events.push(event)), true);
  assert.deepEqual(events[0], {
    key: 'authz.search-session', action: 'blocked', source: 'nextPage',
    ip: '192.0.2.8',
    detail: 'unauthenticated global-search pagination subscription',
  });
  assert.doesNotThrow(() => recordLoggedOutPaginationProbe(
    { userId: null }, 'previousPage', () => { throw new Error('offline'); }));
});

test('ordinary authenticated pagination is never logged', () => {
  const events = [];
  assert.equal(recordLoggedOutPaginationProbe(
    { userId: 'user-a' }, 'nextPage', event => events.push(event)), false);
  assert.deepEqual(events, []);
});

test('every global-search pagination publication uses the owner selector', () => {
  for (const name of ['nextPage', 'previousPage']) {
    const start = cards.indexOf(`Meteor.publish('${name}'`);
    const end = cards.indexOf('Meteor.publish(', start + 20);
    const body = cards.slice(start, end < 0 ? undefined : end);
    assert.match(body, /ownedSearchSessionSelector\(this\.userId, sessionId\)/, name);
    assert.match(body, /if \(!sessionSelector\)/, name);
    assert.match(body, /ReactiveCache\.getSessionData\(sessionSelector\)/, name);
    assert.match(body, /if \(!session\) return this\.ready\(\)/, name);
  }
});

test('no pagination path looks up a session id without its owner (negative)', () => {
  assert.doesNotMatch(cards,
    /Meteor\.publish\('(nextPage|previousPage)'[\s\S]*?getSessionData\(\{\s*sessionId\s*\}\)/);
});

console.log(`\nsearchPaginationAuthorization: ${passed} tests passed`);
