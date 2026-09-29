'use strict';

// Rule variables in action values (models/lib/ruleVarsSubstitute.js,
// server/rulesHelper.js). Run: node tests/ruleVariables.test.cjs
//
// Maintainer decision 2026-09-29 (#4294, #3195, #4278): reuse the email
// {token} syntax for rule action values, adding {creator}, {assignees},
// {members} and {customField:Name}. People tokens are usernames in text and
// email addresses in the send-email recipient; unknown tokens stay literal.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { substituteVars, recipientVars } = require('../models/lib/ruleVarsSubstitute.js');

const vars = {
  card: 'Fix login', creator: 'alice', assignees: 'bob, carol', members: '',
  customfield: { 'target list': 'Review', points: '5' },
  people: {
    creator: [{ username: 'alice', email: 'alice@example.test' }],
    assignees: [{ username: 'bob', email: 'bob@example.test' }, { username: 'carol', email: '' }],
    members: [],
  },
};

// Custom fields by name, case-insensitive; unknown ones stay literal.
assert.equal(substituteVars('Move to {customField:Target List}', vars), 'Move to Review');
assert.equal(substituteVars('{CUSTOMFIELD: points } points', vars), '5 points');
assert.equal(substituteVars('{customField:Missing}', vars), '{customField:Missing}');
assert.equal(substituteVars('{other:Points}', vars), '{other:Points}', 'only customField takes an argument');
assert.equal(substituteVars('{customField:}', vars), '{customField:}');
// Object values never render as "[object Object]".
assert.equal(substituteVars('{people} {customfield}', vars), '{people} {customfield}');
// People in text are usernames; the older tokens still work.
assert.equal(substituteVars('{card} for {creator}; {assignees}', vars), 'Fix login for alice; bob, carol');
assert.equal(substituteVars('{nobody}', vars), '{nobody}');
assert.equal(substituteVars(undefined, vars), undefined);

// In the recipient, people are addresses; nobody with an address is empty.
const to = recipientVars(vars, vars.people);
assert.equal(substituteVars('{assignees}', to), 'bob@example.test', 'people without an address are left out');
assert.equal(substituteVars('{creator}, boss@example.test', to), 'alice@example.test, boss@example.test');
assert.equal(substituteVars('{members}', to), '');
assert.equal(to.customfield['target list'], 'Review', 'custom fields survive into the recipient context');
assert.equal(vars.creator, 'alice', 'the text context is not changed');

// The rule engine applies them, and keeps literal values unchanged.
const helper = fs.readFileSync(path.join(__dirname, '../server/rulesHelper.js'), 'utf8');
assert.match(helper, /substituteVars\(action\.emailTo, recipientVars\(ruleVars, ruleVars\.people\)\)/);
assert.match(helper, /\.split\(','\)\.map\(address => address\.trim\(\)\)\.filter\(Boolean\)/, 'empty recipient entries are dropped');
assert.match(helper, /for \(const username of ruleUsernames\(action\.username, ruleVars\)\)/);
assert.match(helper, /title: substituteVars\(action\.listName, ruleVars\)/);
assert.match(helper, /title: substituteVars\(action\.swimlaneName, ruleVars\)/);
assert.match(helper, /if \(typeof value !== 'string' \|\| !value\.includes\('\{'\)\) return value \? \[value\] : \[\];/,
  'a literal username is used exactly as before');
assert.match(helper, /filterAdminOnlyDefinitions\(definitions \|\| \[\], false\)/, 'admin-only custom fields never reach rule text');

console.log('  ok - rule action values resolve people and custom-field variables');
