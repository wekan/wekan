'use strict';
// The sign-in name field had no autocomplete attribute (spec 48, 2026-11-24).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { autocompleteFor } = require('../models/lib/accountsAutocomplete');

test('each account text field gets its purpose', () => {
  assert.equal(autocompleteFor({ _id: 'username_and_email' }), 'username');
  assert.equal(autocompleteFor({ _id: 'username', autocomplete: 'username' }), 'username');
  assert.equal(autocompleteFor({ _id: 'email' }), 'email');
  assert.equal(autocompleteFor({ _id: 'x', autocomplete: 'one-time-code' }), 'one-time-code', 'the field setting wins');
});

test('negative: an unknown field or nothing gets none', () => {
  assert.equal(autocompleteFor({ _id: 'fullname' }), '');
  assert.equal(autocompleteFor(null), '');
});

test('the hook is loaded with the account templates', () => {
  const users = fs.readFileSync(path.join(__dirname, '../client/features/users.js'), 'utf8');
  assert.match(users, /import '\/client\/components\/users\/accountsAutocomplete\.js';/);
  const hook = fs.readFileSync(path.join(__dirname, '../client/components/users/accountsAutocomplete.js'), 'utf8');
  assert.match(hook, /Template\.atTextInput\.onRendered/);
});
