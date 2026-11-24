'use strict';

// P3 (docs/Compliance/README.md): emergency access. An impersonation marked
// as emergency is kept with its note, and every other administrator is told
// at once by e-mail.
// Run: node --test tests/emergencyAccess.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const E = require('../models/lib/emergencyAccess');

test('an emergency impersonation is recorded as one, with its note; an ordinary one as before', () => {
  assert.deepEqual(E.impersonationRecord('a1', 'u1', { emergency: true, note: '  locked out, on call  ' }),
    { adminId: 'a1', userId: 'u1', reason: 'emergency', note: 'locked out, on call' });
  assert.deepEqual(E.impersonationRecord('a1', 'u1'), { adminId: 'a1', userId: 'u1', reason: 'clickedImpersonate' });
  assert.deepEqual(E.impersonationRecord('a1', 'u1', { emergency: false, note: 'x' }), { adminId: 'a1', userId: 'u1', reason: 'clickedImpersonate' },
    'a note alone does not make it an emergency');
  assert.equal(E.impersonationRecord('a1', 'u1', { emergency: true, note: 'x'.repeat(900) }).note.length, E.MAX_NOTE);
});

test('every OTHER administrator who can sign in and has an address is told', () => {
  const admins = [
    { _id: 'a1', isAdmin: true, emails: [{ address: 'a1@x' }] },
    { _id: 'a2', isAdmin: true, emails: [{ address: 'a2@x' }] },
    { _id: 'a3', isAdmin: true, loginDisabled: true, emails: [{ address: 'a3@x' }] },
    { _id: 'a4', isAdmin: true, emails: [] },
    { _id: 'u5', isAdmin: false, emails: [{ address: 'u5@x' }] },
  ];
  assert.deepEqual(E.notifiedAdmins(admins, 'a1').map(a => a._id), ['a2']);
});

test('the method: checks its options, records, and e-mails without letting a failed e-mail stop it', () => {
  const users = read('server/models/users.js');
  const m = users.slice(users.indexOf('async impersonate(userId, options) {'), users.indexOf('async isImpersonated('));
  assert.match(m, /check\(options, Match\.Maybe\(Match\.ObjectIncluding\(\{ emergency: Match\.Maybe\(Boolean\), note: Match\.Maybe\(String\) \}\)\)\);/);
  assert.ok(m.indexOf("throw new Meteor.Error(403, 'Permission denied')") < m.indexOf('impersonationRecord('), 'only an administrator, before anything is kept');
  assert.match(m, /if \(record\.reason === 'emergency'\) \{/);
  assert.match(m, /subject: 'email-emergency-access-subject'/);
  assert.match(m, /\.catch\(e => console\.error\('\[emergency-access\] could not e-mail'/);
  assert.ok(m.indexOf('await this.setUserId(userId);') > m.indexOf("record.reason === 'emergency'"), 'told before the switch');
  assert.match(read('models/impersonatedUsers.js'), /note: \{[\s\S]{0,300}?type: String,\s*optional: true,\s*max: 500,/, 'the schema keeps the note');
  assert.match(read('client/components/settings/peopleBody.js'), /const args = emergency \? \[userId, \{ emergency: true, note \}\] : \[userId\];/);
});
