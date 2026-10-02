'use strict';

// Guard: AuthMethodBleed (2026-10-02). 'user-authenticationMethod' answered any signed-in user
// with ANY user's organizations, teams and login method, looked up by
// username. It now answers only for the caller's own account.
// Run: node tests/userAuthMethodPublication.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/publications/users.js'), 'utf8');
const pub = src.slice(src.indexOf("Meteor.publish('user-authenticationMethod'"), src.indexOf('\n});', src.indexOf("Meteor.publish('user-authenticationMethod'")));

test('the lookup is pinned to the caller', () => {
  assert.match(pub, /\{ _id: this\.userId, \$or: \[\{ _id: match \}, \{ 'emails\.address': match \}, \{ username: match \}\] \}/);
  // Unauthenticated callers still get nothing and are recorded (negative).
  assert.match(pub, /if \(!this\.userId\) \{[\s\S]{0,400}return this\.ready\(\);/);
});

test('negative: no publication looks users up by a client-given name with org or team fields', () => {
  for (const m of src.matchAll(/Meteor\.publish\('([^']+)'[\s\S]*?\n\}\);/g)) {
    const body = m[0];
    if (!/\b(orgs|teams): 1/.test(body)) continue;
    if (!/username: (match|searchTerm|\w+Regex)/.test(body)) continue;
    assert.match(body, /_id: this\.userId/, `${m[1]} publishes other users' orgs/teams`);
  }
});
