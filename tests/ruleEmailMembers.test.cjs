'use strict';

// #2435: a member picker with autocomplete for a rule email's To field; free
// addresses still allowed.
// Run: node tests/ruleEmailMembers.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { mentionedUsernames, expandMemberMentions, memberChoices, addRecipient } = require('../models/lib/ruleEmailMembers.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const members = { alice: 'alice@example.com', bob: 'bob@example.com' };
const lookup = name => members[name] || null;

// Positive.
assert.equal(expandMemberMentions('@alice, boss@example.com, @bob', lookup), 'alice@example.com, boss@example.com, bob@example.com');
assert.equal(expandMemberMentions('boss@example.com', lookup), 'boss@example.com', 'free addresses as before');
assert.deepEqual(mentionedUsernames('@alice, x@y.z, @b.o_b-1'), ['alice', 'b.o_b-1']);
assert.deepEqual(memberChoices([{ username: 'alice', fullname: 'Alice Smith' }, { username: 'bob' }], '@sm'),
  [{ value: '@alice', label: 'Alice Smith (@alice)' }], 'autocomplete by user name or full name');
assert.equal(memberChoices([{ username: 'a' }, { username: 'b' }], '').length, 2);
assert.equal(addRecipient('boss@example.com', '@alice'), 'boss@example.com, @alice');
console.log('  ok - members by @username, free addresses kept, autocomplete');

// Negative.
assert.equal(expandMemberMentions('@mallory, @alice', lookup), 'alice@example.com', 'not a member: dropped, never sent as text');
assert.equal(expandMemberMentions('@alice, alice@example.com, @alice', lookup), 'alice@example.com', 'once each');
assert.equal(expandMemberMentions('', lookup), '');
assert.deepEqual(mentionedUsernames('a@alice.com, @, @@x, @a b'), [], 'an address with @ inside is not a mention');
assert.equal(addRecipient('@alice', '@alice'), '@alice', 'picking twice adds once');
assert.equal(memberChoices([{ username: '' }, null, { fullname: 'x' }], '').length, 0);
assert.equal(memberChoices(Array.from({ length: 50 }, (_, i) => ({ username: `u${i}` })), '').length, 20, 'bounded list');
console.log('  ok - non-members, duplicates and addresses are not mistaken');

// Server: only the board's ACTIVE members' addresses, looked up at send time.
const helper = read('server/rulesHelper.js');
const prep = helper.slice(helper.indexOf('async prepareEmailAction('), helper.indexOf('const body = substituteVars(action.emailMsg'));
assert.match(prep, /const memberIds = new Set\(\(\(board && board\.members\) \|\| \[\]\)\.filter\(m => m && m\.isActive !== false\)\.map\(m => m\.userId\)\);/);
assert.match(prep, /users\.filter\(u => memberIds\.has\(u\._id\)\)/, 'a user name of somebody outside the board is never resolved');
assert.match(prep, /to = expandMemberMentions\(to, username => addresses\.get\(username\) \|\| null\);/);

// UI: the picker, with a datalist of members, and @username into To.
const jade = read('client/components/rules/actions/mailActions.jade');
assert.match(jade, /input\.js-email-to-member\(type="text" list="email-to-members"/);
assert.match(jade, /datalist#email-to-members\s*\n\s*each memberChoices\s*\n\s*option\(value=value\)= label/);
assert.match(jade, /input\(id="email-to",type=text,placeholder="\{\{_'r-to'\}\}"\)/, 'To stays a free text field');
const js = read('client/components/rules/actions/mailActions.js');
assert.match(js, /'change \.js-email-to-member'\(event, tpl\) \{[\s\S]{0,300}to\.value = addRecipient\(to\.value, value\);/);
assert.doesNotMatch(js, /emails\b/, 'the picker never reads a member\'s email address');
console.log('  ok - the server resolves members only; the picker never sees an address');

console.log('\nruleEmailMembers: all tests passed');
