'use strict';

// P3 (docs/Compliance/README.md): Where I am signed in - every session of the
// account, ending one, and an administrator ending all of another account's.
// Run: node --test tests/sessionList.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const S = require('../models/lib/sessionList');
const idOf = h => crypto.createHash('sha256').update(`session:${h}`).digest('hex').slice(0, 16);

const tokens = [
  { hashedToken: 'H1', when: new Date('2026-11-20T10:00:00Z') },
  { hashedToken: 'H2', when: new Date('2026-11-24T08:00:00Z') },
  { hashedToken: 'H3', when: new Date('2026-11-22T09:00:00Z') },
];

test('this browser first, then newest; when last active where it is known', () => {
  const rows = S.sessionRows(tokens, { currentHashed: 'H1', lastActive: { H3: new Date('2026-11-24T09:00:00Z') }, idOf });
  assert.deepEqual(rows.map(r => r.current), [true, false, false]);
  assert.equal(rows[1].when.toISOString(), '2026-11-24T08:00:00.000Z');
  assert.equal(rows[2].lastActiveAt.toISOString(), '2026-11-24T09:00:00.000Z');
});

test('negative: the list names a session by an opaque id, never the token or its hash', () => {
  const rows = S.sessionRows(tokens, { currentHashed: 'H1', idOf });
  for (const r of rows) {
    assert.match(r.id, /^[0-9a-f]{16}$/);
    assert.ok(!JSON.stringify(r).includes('H1') && !JSON.stringify(r).includes('hashedToken'));
  }
  assert.equal(S.tokenFor(tokens, idOf('H2'), idOf), 'H2');
  assert.equal(S.tokenFor(tokens, 'not-an-id', idOf), null);
  assert.equal(S.tokenFor(tokens, idOf('H9'), idOf), null, 'a session of somebody else is not found');
});

test('ending one: only the caller\'s own account, only that token; an admin ends all, audited', () => {
  const m = read('server/methods/sessions.js');
  const end = m.slice(m.indexOf('async endMySession('), m.indexOf('async adminLogoutUser('));
  assert.match(end, /tokenFor\(await tokensOf\(this\.userId\), id, idOf\)/, 'looked up in the caller\'s own tokens');
  assert.match(end, /Meteor\.users\.updateAsync\(this\.userId, \{ \$pull: \{ 'services\.resume\.loginTokens': \{ hashedToken: hashed \} \} \}\)/);
  const admin = m.slice(m.indexOf('async adminLogoutUser('));
  assert.match(admin, /if \(!admin \|\| admin\.loginDisabled \|\| !isSiteAdmin\(admin\)\) throw new Meteor\.Error\('not-authorized'\);/);
  assert.ok(require('../models/lib/adminAudit').AUDITED_METHODS.includes('adminLogoutUser'));
  assert.match(read('client/components/users/userHeader.jade'), /button\.js-end-session\(type="button" data-session="\{\{id\}\}"\)/);
  assert.match(read('client/components/settings/peopleBody.jade'), /a\.js-admin-logout-user/);
});
